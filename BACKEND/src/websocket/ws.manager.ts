import type { WebSocket } from "@fastify/websocket";
import { logger } from "../utils/logger.js";

interface WsClient {
  socket: WebSocket;
  userId: string;
}

class WsManager {
  private clients = new Map<string, Set<WsClient>>();

  add(userId: string, socket: WebSocket) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    const client: WsClient = { socket, userId };
    this.clients.get(userId)!.add(client);

    socket.on("close", () => {
      this.clients.get(userId)?.delete(client);
      if (this.clients.get(userId)?.size === 0) {
        this.clients.delete(userId);
      }
      logger.debug("WS client disconnected", { userId });
    });

    logger.debug("WS client connected", { userId });
  }

  sendToUser(userId: string, data: unknown) {
    const userClients = this.clients.get(userId);
    if (!userClients) return;

    const message = JSON.stringify(data);
    for (const client of userClients) {
      if (client.socket.readyState === 1) {
        client.socket.send(message);
      }
    }
  }

  broadcast(data: unknown, excludeUserId?: string) {
    const message = JSON.stringify(data);
    for (const [userId, clients] of this.clients) {
      if (userId === excludeUserId) continue;
      for (const client of clients) {
        if (client.socket.readyState === 1) {
          client.socket.send(message);
        }
      }
    }
  }

  getOnlineCount(): number {
    return this.clients.size;
  }
}

export const wsManager = new WsManager();
