import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authorize } from "../../middlewares/authorize.js";
import { PERMISSIONS, type Permission } from "../../constants/permissions.js";
import { exportFromDb } from "./export.service.js";

/**
 * Export routes — query dữ liệu từ DB local (không qua upstream).
 * Trả về tất cả records không phân trang, dùng cho xuất XLSX trên frontend.
 */
export async function exportRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  // Generic export handler factory
  const makeHandler = (table: string, permission: Permission) => {
    return {
      preHandler: [authorize(permission)],
      handler: async (request: FastifyRequest, reply: FastifyReply) => {
        const { startDate, endDate, username, agentId } = request.body as Record<string, string>;
        const userId = (request.user as any).userId;

        const result = await exportFromDb(app, userId, table, {
          startDate,
          endDate,
          username,
          agentId,
        });

        return reply.send({ success: true, data: result });
      },
    };
  };

  // Report endpoints
  app.post("/report-funds", makeHandler("proxyReportFunds", PERMISSIONS.REPORT_READ));
  app.post("/report-lottery", makeHandler("proxyReportLottery", PERMISSIONS.REPORT_READ));
  app.post("/report-third-game", makeHandler("proxyReportThirdGame", PERMISSIONS.REPORT_READ));

  // Finance endpoints
  app.post("/deposit-list", makeHandler("proxyDeposit", PERMISSIONS.FINANCE_READ));
  app.post("/withdrawals-record", makeHandler("proxyWithdrawal", PERMISSIONS.FINANCE_READ));

  // Bet endpoints
  app.post("/bet-list", makeHandler("proxyBet", PERMISSIONS.BET_READ));
  app.post("/bet-order", makeHandler("proxyBetOrder", PERMISSIONS.BET_READ));

  // Member endpoints
  app.post("/user-list", makeHandler("proxyUser", PERMISSIONS.MEMBER_READ));
}
