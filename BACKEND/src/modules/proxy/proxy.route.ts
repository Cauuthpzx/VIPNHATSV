import type { FastifyInstance } from "fastify";
import { authorize } from "../../middlewares/authorize.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import {
  userListHandler,
  inviteListHandler,
  inviteListLocalHandler,
  reportLotteryHandler,
  reportFundsHandler,
  reportThirdGameHandler,
  bankListHandler,
  depositListHandler,
  withdrawalsRecordHandler,
  betListHandler,
  betOrderHandler,
  rebateOddsHandler,
  getLotteryHandler,
  listAgentsHandler,
  updateAgentCookieHandler,
  cookieHealthHandler,
  editPasswordHandler,
  editFundPasswordHandler,
} from "./proxy.controller.js";

export async function proxyRoutes(app: FastifyInstance) {
  // All proxy routes require authentication
  app.addHook("preHandler", app.authenticate);

  // Hội viên
  app.post("/user", { preHandler: [authorize(PERMISSIONS.MEMBER_READ)] }, userListHandler);

  // Mã giới thiệu (local DB — đồng bộ 1 lần, đọc từ DB)
  app.post("/invite-list", { preHandler: [authorize(PERMISSIONS.INVITE_READ)] }, inviteListLocalHandler);

  // Báo cáo
  app.post("/report-lottery", { preHandler: [authorize(PERMISSIONS.REPORT_READ)] }, reportLotteryHandler);
  app.post("/report-funds", { preHandler: [authorize(PERMISSIONS.REPORT_READ)] }, reportFundsHandler);
  app.post("/report-third-game", { preHandler: [authorize(PERMISSIONS.REPORT_READ)] }, reportThirdGameHandler);

  // Tài chính
  app.post("/bank-list", { preHandler: [authorize(PERMISSIONS.FINANCE_READ)] }, bankListHandler);
  app.post("/deposit-list", { preHandler: [authorize(PERMISSIONS.FINANCE_READ)] }, depositListHandler);
  app.post("/withdrawals-record", { preHandler: [authorize(PERMISSIONS.FINANCE_READ)] }, withdrawalsRecordHandler);

  // Đơn cược
  app.post("/bet-list", { preHandler: [authorize(PERMISSIONS.BET_READ)] }, betListHandler);
  app.post("/bet-order", { preHandler: [authorize(PERMISSIONS.BET_READ)] }, betOrderHandler);

  // Hoàn trả
  app.post("/rebate-odds", { preHandler: [authorize(PERMISSIONS.REBATE_READ)] }, rebateOddsHandler);
  app.post("/lottery-dropdown", { preHandler: [authorize(PERMISSIONS.REBATE_READ)] }, getLotteryHandler);

  // Mật khẩu (action endpoints)
  app.post("/edit-password", { preHandler: [authorize(PERMISSIONS.PASSWORD_WRITE)] }, editPasswordHandler);
  app.post("/edit-fund-password", { preHandler: [authorize(PERMISSIONS.PASSWORD_WRITE)] }, editFundPasswordHandler);
}

export async function agentRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/", listAgentsHandler);
  app.put("/:id/cookie", updateAgentCookieHandler);
  app.get("/cookie-health", cookieHealthHandler);
}
