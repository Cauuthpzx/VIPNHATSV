import type { FastifyInstance } from "fastify";
import {
  userListHandler,
  inviteListHandler,
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
} from "./proxy.controller.js";

export async function proxyRoutes(app: FastifyInstance) {
  // All proxy routes require authentication
  app.addHook("preHandler", app.authenticate);

  app.post("/user", userListHandler);
  app.post("/invite-list", inviteListHandler);
  app.post("/report-lottery", reportLotteryHandler);
  app.post("/report-funds", reportFundsHandler);
  app.post("/report-third-game", reportThirdGameHandler);
  app.post("/bank-list", bankListHandler);
  app.post("/deposit-list", depositListHandler);
  app.post("/withdrawals-record", withdrawalsRecordHandler);
  app.post("/bet-list", betListHandler);
  app.post("/bet-order", betOrderHandler);
  app.post("/rebate-odds", rebateOddsHandler);
  app.post("/lottery-dropdown", getLotteryHandler);
}

export async function agentRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/", listAgentsHandler);
  app.put("/:id/cookie", updateAgentCookieHandler);
}
