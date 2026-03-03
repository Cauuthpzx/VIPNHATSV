import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { sendSuccess, sendError } from "../../utils/response.js";
import { HTTP_STATUS } from "../../constants/http.js";
import { ERROR_CODES } from "../../constants/error-codes.js";
import { ValidationError } from "../../errors/ValidationError.js";
import * as notifService from "./notification.service.js";
import {
  listNotificationsSchema,
  markAsReadSchema,
  memberDetailParamsSchema,
} from "./notification.schema.js";

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
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = listNotificationsSchema.safeParse(request.query);
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

      const { unread, limit, offset } = parsed.data;
      const unreadOnly = unread === "true" || unread === "1";

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
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = markAsReadSchema.safeParse(request.body);
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

      const { ids, all } = parsed.data;

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

  // DELETE /notifications — delete all notifications
  app.delete(
    "/",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const deleted = await notifService.deleteAll(app.prisma);
      return sendSuccess(reply, { deleted });
    },
  );

  // GET /notifications/member/:agentId/:username — member detail for notification
  app.get(
    "/member/:agentId/:username",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = memberDetailParamsSchema.safeParse(request.params);
      if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

      const { agentId, username } = parsed.data;
      const member = await notifService.getMemberDetail(app.prisma, agentId, username);

      if (!member) {
        return sendError(reply, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, "Không tìm thấy hội viên");
      }

      return sendSuccess(reply, member);
    },
  );
}
