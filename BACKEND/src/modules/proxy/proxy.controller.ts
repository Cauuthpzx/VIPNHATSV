import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { ZodObject, ZodRawShape } from "zod";
import type { Prisma } from "@prisma/client";
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
  inviteListLocalSchema,
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

// ---------------------------------------------------------------------------
// Invite list — local DB (synced data, no upstream call)
// ---------------------------------------------------------------------------

export async function inviteListLocalHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const parsed = inviteListLocalSchema.safeParse(request.body);
  if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

  const { page, limit, agentId, invite_code, create_time } = parsed.data;

  // Build where clause
  const where: Prisma.ProxyInviteWhereInput = {};

  if (agentId) {
    where.agentId = agentId;
  }

  if (invite_code) {
    where.inviteCode = { contains: invite_code, mode: "insensitive" };
  }

  if (create_time) {
    // Format: "YYYY-MM-DD - YYYY-MM-DD"
    const parts = create_time.split(" - ");
    if (parts.length === 2) {
      where.createTime = { gte: parts[0].trim(), lte: parts[1].trim() + " 23:59:59" };
    }
  }

  const [items, total, agents] = await Promise.all([
    this.prisma.proxyInvite.findMany({
      where,
      orderBy: { createTime: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    this.prisma.proxyInvite.count({ where }),
    this.prisma.agent.findMany({ select: { id: true, name: true } }),
  ]);

  // Build agent name map
  const agentNameMap = new Map(agents.map((a) => [a.id, a.name]));

  // Map to upstream-compatible format for frontend
  const mapped = items.map((item) => ({
    _agentName: agentNameMap.get(item.agentId) ?? "",
    invite_code: item.inviteCode,
    user_type: item.userType,
    reg_count: item.regCount ?? 0,
    scope_reg_count: item.scopeRegCount ?? 0,
    recharge_count: item.rechargeCount ?? 0,
    first_recharge_count: item.firstRechargeCount ?? 0,
    register_recharge_count: item.registerRechargeCount ?? 0,
    remark: item.remark,
    create_time: item.createTime,
  }));

  return sendSuccess(reply, { items: mapped, total });
}

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

export async function cookieHealthHandler(
  this: FastifyInstance,
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const results = await agentService.checkCookieHealth(this);
  return sendSuccess(reply, results);
}
