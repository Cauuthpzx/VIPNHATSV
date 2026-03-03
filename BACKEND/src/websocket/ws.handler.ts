import type { FastifyInstance } from "fastify";
import { wsManager } from "./ws.manager.js";
import { logger } from "../utils/logger.js";

const AUTH_TIMEOUT_MS = 5_000;

export async function wsRoutes(app: FastifyInstance) {
  app.get("/ws", { websocket: true }, (socket, _request) => {
    // Authentication via first message instead of query param (security best practice).
    // Client must send: { type: "auth", token: "<jwt>" } within 5 seconds.

    let authenticated = false;
    let userId: string | null = null;

    const authTimer = setTimeout(() => {
      if (!authenticated) {
        socket.send(JSON.stringify({ error: "Authentication timeout" }));
        socket.close();
      }
    }, AUTH_TIMEOUT_MS);

    socket.on("message", async (raw: Buffer | ArrayBuffer | Buffer[]) => {
      try {
        const data = JSON.parse(raw.toString());

        // First message must be auth
        if (!authenticated) {
          if (data.type !== "auth" || !data.token) {
            socket.send(JSON.stringify({ error: "First message must be auth" }));
            socket.close();
            return;
          }

          try {
            const payload = app.jwt.verify<{
              jti?: string;
              userId: string;
              tokenVersion?: number;
            }>(data.token);

            // Check blacklist (same logic as authenticate middleware)
            if (payload.jti) {
              try {
                const blacklisted = await app.redis.get(`auth:blacklist:${payload.jti}`);
                if (blacklisted) {
                  socket.send(JSON.stringify({ error: "Token has been revoked" }));
                  socket.close();
                  return;
                }
              } catch (err) {
                // Redis error — fail open, log warning
                logger.warn("WS: Redis unavailable for blacklist check", { error: (err as Error).message });
              }
            }

            // Check token version (mass invalidation on password change / logout-all)
            if (payload.tokenVersion !== undefined) {
              try {
                const currentVersion = await app.redis.get(`auth:token_version:${payload.userId}`);
                if (currentVersion !== null && payload.tokenVersion < parseInt(currentVersion, 10)) {
                  socket.send(JSON.stringify({ error: "Token has been revoked" }));
                  socket.close();
                  return;
                }
              } catch (err) {
                // Redis error — fail open
                logger.warn("WS: Redis unavailable for token version check", { error: (err as Error).message });
              }
            }

            userId = payload.userId;
            authenticated = true;
            clearTimeout(authTimer);
            wsManager.add(userId, socket);
            socket.send(JSON.stringify({ type: "auth_ok" }));
          } catch {
            socket.send(JSON.stringify({ error: "Invalid token" }));
            socket.close();
          }
          return;
        }

        // Authenticated messages
        logger.debug("WS message received", { userId, type: data.type });
        socket.send(JSON.stringify({ type: "ack", data }));
      } catch {
        socket.send(JSON.stringify({ error: "Invalid JSON" }));
      }
    });

    socket.on("error", (err: Error) => {
      logger.error("WS error", { userId, error: err.message });
    });

    socket.on("close", () => {
      clearTimeout(authTimer);
    });
  });
}
