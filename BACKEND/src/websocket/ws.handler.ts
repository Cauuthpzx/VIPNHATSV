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

    socket.on("message", (raw) => {
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
            const payload = app.jwt.verify<{ userId: string }>(data.token);
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

    socket.on("error", (err) => {
      logger.error("WS error", { userId, error: err.message });
    });

    socket.on("close", () => {
      clearTimeout(authTimer);
    });
  });
}
