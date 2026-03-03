import type { FastifyInstance, FastifyRequest } from "fastify";
import { authorize } from "../../middlewares/authorize.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import {
  userListHandler,
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
  getAgentHandler,
  createAgentHandler,
  updateAgentHandler,
  deleteAgentHandler,
} from "./proxy.controller.js";

// ---------------------------------------------------------------------------
// Rate limit configs — per user (from JWT), not per IP
// ---------------------------------------------------------------------------

function userKeyGenerator(request: FastifyRequest): string {
  return (request.user as any)?.userId ?? request.ip;
}

/** Read endpoints: 30 req/min per user */
const PROXY_RATE = {
  config: {
    rateLimit: { max: 30, timeWindow: 60_000, keyGenerator: userKeyGenerator },
  },
};

/** Write/action endpoints: 10 req/min per user */
const ACTION_RATE = {
  config: {
    rateLimit: { max: 10, timeWindow: 60_000, keyGenerator: userKeyGenerator },
  },
};

export async function proxyRoutes(app: FastifyInstance) {
  // All proxy routes require authentication
  app.addHook("preHandler", app.authenticate);

  // Hội viên
  app.post("/user", { preHandler: [authorize(PERMISSIONS.MEMBER_READ)], ...PROXY_RATE }, userListHandler);

  // Mã giới thiệu (local DB — đồng bộ 1 lần, đọc từ DB)
  app.post(
    "/invite-list",
    { preHandler: [authorize(PERMISSIONS.INVITE_READ)], ...PROXY_RATE },
    inviteListLocalHandler,
  );

  // Báo cáo
  app.post(
    "/report-lottery",
    { preHandler: [authorize(PERMISSIONS.REPORT_READ)], ...PROXY_RATE },
    reportLotteryHandler,
  );
  app.post(
    "/report-funds",
    { preHandler: [authorize(PERMISSIONS.REPORT_READ)], ...PROXY_RATE },
    reportFundsHandler,
  );
  app.post(
    "/report-third-game",
    { preHandler: [authorize(PERMISSIONS.REPORT_READ)], ...PROXY_RATE },
    reportThirdGameHandler,
  );

  // Tài chính
  app.post(
    "/bank-list",
    { preHandler: [authorize(PERMISSIONS.FINANCE_READ)], ...PROXY_RATE },
    bankListHandler,
  );
  app.post(
    "/deposit-list",
    { preHandler: [authorize(PERMISSIONS.FINANCE_READ)], ...PROXY_RATE },
    depositListHandler,
  );
  app.post(
    "/withdrawals-record",
    { preHandler: [authorize(PERMISSIONS.FINANCE_READ)], ...PROXY_RATE },
    withdrawalsRecordHandler,
  );

  // Đơn cược
  app.post("/bet-list", { preHandler: [authorize(PERMISSIONS.BET_READ)], ...PROXY_RATE }, betListHandler);
  app.post("/bet-order", { preHandler: [authorize(PERMISSIONS.BET_READ)], ...PROXY_RATE }, betOrderHandler);

  // Hoàn trả
  app.post(
    "/rebate-odds",
    { preHandler: [authorize(PERMISSIONS.REBATE_READ)], ...PROXY_RATE },
    rebateOddsHandler,
  );
  app.post(
    "/lottery-dropdown",
    { preHandler: [authorize(PERMISSIONS.REBATE_READ)], ...PROXY_RATE },
    getLotteryHandler,
  );

  // Mật khẩu (action endpoints — more restrictive)
  app.post(
    "/edit-password",
    { preHandler: [authorize(PERMISSIONS.PASSWORD_WRITE)], ...ACTION_RATE },
    editPasswordHandler,
  );
  app.post(
    "/edit-fund-password",
    { preHandler: [authorize(PERMISSIONS.PASSWORD_WRITE)], ...ACTION_RATE },
    editFundPasswordHandler,
  );
}

export async function agentRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  // Read
  app.get("/", listAgentsHandler);
  app.get<{ Params: { id: string } }>("/:id", getAgentHandler);
  app.get("/cookie-health", cookieHealthHandler);

  // Write (require sync:write)
  app.post("/", { preHandler: [authorize(PERMISSIONS.SYNC_WRITE)] }, createAgentHandler);
  app.patch<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [authorize(PERMISSIONS.SYNC_WRITE)] },
    updateAgentHandler,
  );
  app.delete<{ Params: { id: string }; Querystring: { mode?: string } }>(
    "/:id",
    { preHandler: [authorize(PERMISSIONS.SYNC_WRITE)] },
    deleteAgentHandler,
  );
  app.put<{ Params: { id: string } }>(
    "/:id/cookie",
    { preHandler: [authorize(PERMISSIONS.SYNC_WRITE)] },
    updateAgentCookieHandler,
  );
}
