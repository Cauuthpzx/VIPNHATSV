import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { ZodObject, ZodRawShape } from "zod";
import * as proxyService from "./proxy.service.js";
import * as agentService from "./agent.service.js";
import {
  userListSchema,
  inviteListSchema,
  reportLotterySchema,
  reportFundsSchema,
  reportThirdGameSchema,
  bankListSchema,
  depositListSchema,
  withdrawalsRecordSchema,
  betListSchema,
  betOrderSchema,
  rebateOddsSchema,
  getLotterySchema,
  updateAgentCookieSchema,
  editPasswordSchema,
  editFundPasswordSchema,
} from "./proxy.schema.js";
import { sendSuccess } from "../../utils/response.js";
import { ValidationError } from "../../errors/ValidationError.js";

function createProxyHandler(
  schema: ZodObject<ZodRawShape>,
  serviceFn: (app: FastifyInstance, input: Record<string, unknown>) => Promise<unknown>,
) {
  return async function (
    this: FastifyInstance,
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);
    const result = await serviceFn(this, parsed.data as Record<string, unknown>);
    return sendSuccess(reply, result);
  };
}

export const userListHandler = createProxyHandler(userListSchema, proxyService.fetchUserList);
export const inviteListHandler = createProxyHandler(inviteListSchema, proxyService.fetchInviteList);
export const reportLotteryHandler = createProxyHandler(reportLotterySchema, proxyService.fetchReportLottery);
export const reportFundsHandler = createProxyHandler(reportFundsSchema, proxyService.fetchReportFunds);
export const reportThirdGameHandler = createProxyHandler(reportThirdGameSchema, proxyService.fetchReportThirdGame);
export const bankListHandler = createProxyHandler(bankListSchema, proxyService.fetchBankList);
export const depositListHandler = createProxyHandler(depositListSchema, proxyService.fetchDepositList);
export const withdrawalsRecordHandler = createProxyHandler(withdrawalsRecordSchema, proxyService.fetchWithdrawalsRecord);
export const betListHandler = createProxyHandler(betListSchema, proxyService.fetchBetList);
export const betOrderHandler = createProxyHandler(betOrderSchema, proxyService.fetchBetOrder);
export const rebateOddsHandler = createProxyHandler(rebateOddsSchema, proxyService.fetchRebateOdds);
export const getLotteryHandler = createProxyHandler(getLotterySchema, proxyService.fetchLotteryDropdown);
export const editPasswordHandler = createProxyHandler(editPasswordSchema, proxyService.editPasswordUpstream);
export const editFundPasswordHandler = createProxyHandler(editFundPasswordSchema, proxyService.editFundPasswordUpstream);

// Agent management
export async function listAgentsHandler(
  this: FastifyInstance,
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const agents = await agentService.listAgents(this);
  return sendSuccess(reply, agents);
}

export async function updateAgentCookieHandler(
  this: FastifyInstance,
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const parsed = updateAgentCookieSchema.safeParse(request.body);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

  const result = await agentService.updateAgentCookie(
    this,
    request.params.id,
    parsed.data.sessionCookie,
    parsed.data.cookieExpires ? new Date(parsed.data.cookieExpires) : undefined,
  );
  return sendSuccess(reply, result);
}
