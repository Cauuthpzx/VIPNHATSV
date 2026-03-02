import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { sendSuccess, sendError } from "../../utils/response.js";
import { HTTP_STATUS } from "../../constants/http.js";
import { ERROR_CODES } from "../../constants/error-codes.js";
import * as notifService from "./notification.service.js";

export async function notificationRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook("preHandler", app.authenticate);

  // GET /notifications/count — lightweight unread count for polling
  app.get(
    "/count",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const unread = await notifService.getUnreadCount(app.prisma);
      return sendSuccess(reply, { unread });
    },
  );

  // GET /notifications — list with optional filters
  app.get(
    "/",
    async (
      request: FastifyRequest<{
        Querystring: { unread?: string; limit?: string; offset?: string };
      }>,
      reply: FastifyReply,
    ) => {
      const unreadOnly = request.query.unread === "true" || request.query.unread === "1";
      const limit = Math.min(Number(request.query.limit) || 50, 200);
      const offset = Math.max(Number(request.query.offset) || 0, 0);

      const result = await notifService.listNotifications(app.prisma, {
        unreadOnly,
        limit,
        offset,
      });
      return sendSuccess(reply, result);
    },
  );

  // POST /notifications/read — mark as read
  app.post(
    "/read",
    async (
      request: FastifyRequest<{ Body: { ids?: string[]; all?: boolean } }>,
      reply: FastifyReply,
    ) => {
      const { ids, all } = request.body ?? {};

      let marked = 0;
      if (all) {
        marked = await notifService.markAllAsRead(app.prisma);
      } else if (ids && ids.length > 0) {
        marked = await notifService.markAsRead(app.prisma, ids);
      }

      return sendSuccess(reply, { marked });
    },
  );

  // DELETE /notifications/read — delete all read notifications
  app.delete(
    "/read",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const deleted = await notifService.deleteRead(app.prisma);
      return sendSuccess(reply, { deleted });
    },
  );

  // GET /notifications/member/:agentId/:username — member detail for notification
  app.get(
    "/member/:agentId/:username",
    async (
      request: FastifyRequest<{
        Params: { agentId: string; username: string };
      }>,
      reply: FastifyReply,
    ) => {
      const { agentId, username } = request.params;
      const member = await notifService.getMemberDetail(app.prisma, agentId, username);

      if (!member) {
        return sendError(reply, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, "Không tìm thấy hội viên");
      }

      return sendSuccess(reply, member);
    },
  );
}
