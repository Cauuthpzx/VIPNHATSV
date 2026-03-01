import type { FastifyInstance } from "fastify";
import { wsManager } from "./ws.manager.js";
import { logger } from "../utils/logger.js";

export async function wsRoutes(app: FastifyInstance) {
  app.get("/ws", { websocket: true }, (socket, request) => {
    const token = (request.query as Record<string, string>).token;

    if (!token) {
      socket.send(JSON.stringify({ error: "Missing token" }));
      socket.close();
      return;
    }

    let payload: { userId: string };
    try {
      payload = app.jwt.verify<{ userId: string }>(token);
    } catch {
      socket.send(JSON.stringify({ error: "Invalid token" }));
      socket.close();
      return;
    }

    wsManager.add(payload.userId, socket);

    socket.on("message", (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        logger.debug("WS message received", { userId: payload.userId, type: data.type });

        // Echo back for now — extend with custom handlers
        socket.send(JSON.stringify({ type: "ack", data }));
      } catch {
        socket.send(JSON.stringify({ error: "Invalid JSON" }));
      }
    });

    socket.on("error", (err) => {
      logger.error("WS error", { userId: payload.userId, error: err.message });
    });
  });
}
