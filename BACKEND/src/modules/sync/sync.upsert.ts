import type { PrismaClient } from "@prisma/client";
import { logger } from "../../utils/logger.js";

type Item = Record<string, unknown>;
type UpsertFn = (prisma: PrismaClient, agentId: string, items: Item[]) => Promise<number>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function str(val: unknown): string | null {
  return val != null && val !== "" ? String(val) : null;
}

function dec(val: unknown): number | null {
  if (val == null || val === "") return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function int(val: unknown): number {
  if (val == null || val === "") return 0;
  const n = parseInt(String(val), 10);
  return isNaN(n) ? 0 : n;
}

// ---------------------------------------------------------------------------
// 1. ProxyUser — username unique toàn cục
// ---------------------------------------------------------------------------

async function upsertUsers(prisma: PrismaClient, agentId: string, items: Item[]): Promise<number> {
  let count = 0;
  for (const item of items) {
    const username = str(item.username);
    if (!username) continue;
    try {
      await prisma.proxyUser.upsert({
        where: { username },
        create: {
          agentId,
          username,
          typeFormat: str(item.type_format),
          parentUser: str(item.parent_user),
          money: dec(item.money),
          depositCount: int(item.deposit_count),
          withdrawalCount: int(item.withdrawal_count),
          depositAmount: dec(item.deposit_amount),
          withdrawalAmount: dec(item.withdrawal_amount),
          loginTime: str(item.login_time),
          registerTime: str(item.register_time),
          statusFormat: str(item.status_format),
          raw: item as object,
          syncedAt: new Date(),
        },
        update: {
          agentId,
          typeFormat: str(item.type_format),
          parentUser: str(item.parent_user),
          money: dec(item.money),
          depositCount: int(item.deposit_count),
          withdrawalCount: int(item.withdrawal_count),
          depositAmount: dec(item.deposit_amount),
          withdrawalAmount: dec(item.withdrawal_amount),
          loginTime: str(item.login_time),
          registerTime: str(item.register_time),
          statusFormat: str(item.status_format),
          raw: item as object,
          syncedAt: new Date(),
        },
      });
      count++;
    } catch (err) {
      logger.warn("upsertUsers failed", { username, error: (err as Error).message });
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// 2. ProxyInvite — (agentId, inviteCode) unique
// ---------------------------------------------------------------------------

async function upsertInvites(prisma: PrismaClient, agentId: string, items: Item[]): Promise<number> {
  let count = 0;
  for (const item of items) {
    const inviteCode = str(item.invite_code);
    if (!inviteCode) continue;
    try {
      await prisma.proxyInvite.upsert({
        where: { uq_invite: { agentId, inviteCode } },
        create: {
          agentId,
          inviteCode,
          userType: str(item.user_type),
          regCount: int(item.reg_count),
          scopeRegCount: int(item.scope_reg_count),
          rechargeCount: int(item.recharge_count),
          firstRechargeCount: int(item.first_recharge_count),
          registerRechargeCount: int(item.register_recharge_count),
          remark: str(item.remark),
          createTime: str(item.create_time),
          raw: item as object,
          syncedAt: new Date(),
        },
        update: {
          userType: str(item.user_type),
          regCount: int(item.reg_count),
          scopeRegCount: int(item.scope_reg_count),
          rechargeCount: int(item.recharge_count),
          firstRechargeCount: int(item.first_recharge_count),
          registerRechargeCount: int(item.register_recharge_count),
          remark: str(item.remark),
          createTime: str(item.create_time),
          raw: item as object,
          syncedAt: new Date(),
        },
      });
      count++;
    } catch (err) {
      logger.warn("upsertInvites failed", { inviteCode, error: (err as Error).message });
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// 3. ProxyDeposit — (agentId, username, amount, type, createTime) unique
// ---------------------------------------------------------------------------

async function upsertDeposits(prisma: PrismaClient, agentId: string, items: Item[]): Promise<number> {
  let count = 0;
  for (const item of items) {
    const username = str(item.username);
    const createTime = str(item.create_time);
    if (!username || !createTime) continue;

    const amount = dec(item.amount);
    const type = str(item.type) ?? "";

    try {
      await prisma.proxyDeposit.upsert({
        where: {
          uq_deposit: {
            agentId,
            username,
            amount: amount ?? 0,
            type,
            createTime,
          },
        },
        create: {
          agentId,
          username,
          userParentFormat: str(item.user_parent_format),
          amount,
          type,
          status: str(item.status),
          createTime,
          raw: item as object,
          syncedAt: new Date(),
        },
        update: {
          userParentFormat: str(item.user_parent_format),
          status: str(item.status),
          raw: item as object,
          syncedAt: new Date(),
        },
      });
      count++;
    } catch (err) {
      logger.warn("upsertDeposits failed", { username, createTime, error: (err as Error).message });
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// 4. ProxyWithdrawal — serialNo unique
// ---------------------------------------------------------------------------

async function upsertWithdrawals(prisma: PrismaClient, agentId: string, items: Item[]): Promise<number> {
  let count = 0;
  for (const item of items) {
    const serialNo = str(item.serial_no);
    if (!serialNo) continue;
    try {
      await prisma.proxyWithdrawal.upsert({
        where: { serialNo },
        create: {
          agentId,
          serialNo,
          username: str(item.username) ?? "",
          userParentFormat: str(item.user_parent_format),
          amount: dec(item.amount),
          userFee: dec(item.user_fee),
          trueAmount: dec(item.true_amount),
          statusFormat: str(item.status_format),
          createTime: str(item.create_time),
          raw: item as object,
          syncedAt: new Date(),
        },
        update: {
          agentId,
          username: str(item.username) ?? "",
          userParentFormat: str(item.user_parent_format),
          amount: dec(item.amount),
          userFee: dec(item.user_fee),
          trueAmount: dec(item.true_amount),
          statusFormat: str(item.status_format),
          createTime: str(item.create_time),
          raw: item as object,
          syncedAt: new Date(),
        },
      });
      count++;
    } catch (err) {
      logger.warn("upsertWithdrawals failed", { serialNo, error: (err as Error).message });
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// 5. ProxyBet — serialNo unique
// ---------------------------------------------------------------------------

async function upsertBets(prisma: PrismaClient, agentId: string, items: Item[]): Promise<number> {
  let count = 0;
  for (const item of items) {
    const serialNo = str(item.serial_no);
    if (!serialNo) continue;
    try {
      await prisma.proxyBet.upsert({
        where: { serialNo },
        create: {
          agentId,
          serialNo,
          username: str(item.username) ?? "",
          lotteryName: str(item.lottery_name),
          playTypeName: str(item.play_type_name),
          playName: str(item.play_name),
          issue: str(item.issue),
          content: str(item.content),
          money: dec(item.money),
          rebateAmount: dec(item.rebate_amount),
          result: dec(item.result),
          statusText: str(item.status_text),
          createTime: str(item.create_time),
          raw: item as object,
          syncedAt: new Date(),
        },
        update: {
          agentId,
          username: str(item.username) ?? "",
          lotteryName: str(item.lottery_name),
          playTypeName: str(item.play_type_name),
          playName: str(item.play_name),
          issue: str(item.issue),
          content: str(item.content),
          money: dec(item.money),
          rebateAmount: dec(item.rebate_amount),
          result: dec(item.result),
          statusText: str(item.status_text),
          createTime: str(item.create_time),
          raw: item as object,
          syncedAt: new Date(),
        },
      });
      count++;
    } catch (err) {
      logger.warn("upsertBets failed", { serialNo, error: (err as Error).message });
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// 6. ProxyBetOrder — serialNo unique
// ---------------------------------------------------------------------------

async function upsertBetOrders(prisma: PrismaClient, agentId: string, items: Item[]): Promise<number> {
  let count = 0;
  for (const item of items) {
    const serialNo = str(item.serial_no);
    if (!serialNo) continue;
    try {
      await prisma.proxyBetOrder.upsert({
        where: { serialNo },
        create: {
          agentId,
          serialNo,
          platformIdName: str(item.platform_id_name),
          platformUsername: str(item.platform_username),
          cName: str(item.c_name),
          gameName: str(item.game_name),
          betAmount: dec(item.bet_amount),
          turnover: dec(item.turnover),
          prize: dec(item.prize),
          winLose: dec(item.win_lose),
          betTime: str(item.bet_time),
          raw: item as object,
          syncedAt: new Date(),
        },
        update: {
          agentId,
          platformIdName: str(item.platform_id_name),
          platformUsername: str(item.platform_username),
          cName: str(item.c_name),
          gameName: str(item.game_name),
          betAmount: dec(item.bet_amount),
          turnover: dec(item.turnover),
          prize: dec(item.prize),
          winLose: dec(item.win_lose),
          betTime: str(item.bet_time),
          raw: item as object,
          syncedAt: new Date(),
        },
      });
      count++;
    } catch (err) {
      logger.warn("upsertBetOrders failed", { serialNo, error: (err as Error).message });
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// 7. ProxyReportLottery — (agentId, username, lotteryName, reportDate) unique
// ---------------------------------------------------------------------------

async function upsertReportLottery(prisma: PrismaClient, agentId: string, items: Item[]): Promise<number> {
  let count = 0;
  for (const item of items) {
    const username = str(item.username);
    const lotteryName = str(item.lottery_name);
    const reportDate = str(item.date) ?? str(item.report_date);
    if (!username || !lotteryName || !reportDate) continue;
    try {
      await prisma.proxyReportLottery.upsert({
        where: { uq_report_lottery: { agentId, username, lotteryName, reportDate } },
        create: {
          agentId,
          username,
          userParentFormat: str(item.user_parent_format),
          lotteryName,
          betCount: int(item.bet_count),
          betAmount: dec(item.bet_amount),
          validAmount: dec(item.valid_amount),
          rebateAmount: dec(item.rebate_amount),
          result: dec(item.result),
          winLose: dec(item.win_lose),
          prize: dec(item.prize),
          reportDate,
          raw: item as object,
          syncedAt: new Date(),
        },
        update: {
          userParentFormat: str(item.user_parent_format),
          betCount: int(item.bet_count),
          betAmount: dec(item.bet_amount),
          validAmount: dec(item.valid_amount),
          rebateAmount: dec(item.rebate_amount),
          result: dec(item.result),
          winLose: dec(item.win_lose),
          prize: dec(item.prize),
          raw: item as object,
          syncedAt: new Date(),
        },
      });
      count++;
    } catch (err) {
      logger.warn("upsertReportLottery failed", { username, reportDate, error: (err as Error).message });
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// 8. ProxyReportFunds — (agentId, username, reportDate) unique
// ---------------------------------------------------------------------------

async function upsertReportFunds(prisma: PrismaClient, agentId: string, items: Item[]): Promise<number> {
  let count = 0;
  for (const item of items) {
    const username = str(item.username);
    const reportDate = str(item.date) ?? str(item.report_date);
    if (!username || !reportDate) continue;
    try {
      await prisma.proxyReportFunds.upsert({
        where: { uq_report_funds: { agentId, username, reportDate } },
        create: {
          agentId,
          username,
          userParentFormat: str(item.user_parent_format),
          depositCount: int(item.deposit_count),
          depositAmount: dec(item.deposit_amount),
          withdrawalCount: int(item.withdrawal_count),
          withdrawalAmount: dec(item.withdrawal_amount),
          chargeFee: dec(item.charge_fee),
          agentCommission: dec(item.agent_commission),
          promotion: dec(item.promotion),
          thirdRebate: dec(item.third_rebate),
          thirdActivityAmount: dec(item.third_activity_amount),
          reportDate,
          raw: item as object,
          syncedAt: new Date(),
        },
        update: {
          userParentFormat: str(item.user_parent_format),
          depositCount: int(item.deposit_count),
          depositAmount: dec(item.deposit_amount),
          withdrawalCount: int(item.withdrawal_count),
          withdrawalAmount: dec(item.withdrawal_amount),
          chargeFee: dec(item.charge_fee),
          agentCommission: dec(item.agent_commission),
          promotion: dec(item.promotion),
          thirdRebate: dec(item.third_rebate),
          thirdActivityAmount: dec(item.third_activity_amount),
          raw: item as object,
          syncedAt: new Date(),
        },
      });
      count++;
    } catch (err) {
      logger.warn("upsertReportFunds failed", { username, reportDate, error: (err as Error).message });
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// 9. ProxyReportThirdGame — (agentId, username, platformIdName, reportDate) unique
// ---------------------------------------------------------------------------

async function upsertReportThirdGame(prisma: PrismaClient, agentId: string, items: Item[]): Promise<number> {
  let count = 0;
  for (const item of items) {
    const username = str(item.username);
    const platformIdName = str(item.platform_id_name);
    const reportDate = str(item.date) ?? str(item.report_date);
    if (!username || !platformIdName || !reportDate) continue;
    try {
      await prisma.proxyReportThirdGame.upsert({
        where: { uq_report_third_game: { agentId, username, platformIdName, reportDate } },
        create: {
          agentId,
          username,
          platformIdName,
          tBetTimes: int(item.t_bet_times),
          tBetAmount: dec(item.t_bet_amount),
          tTurnover: dec(item.t_turnover),
          tPrize: dec(item.t_prize),
          tWinLose: dec(item.t_win_lose),
          reportDate,
          raw: item as object,
          syncedAt: new Date(),
        },
        update: {
          tBetTimes: int(item.t_bet_times),
          tBetAmount: dec(item.t_bet_amount),
          tTurnover: dec(item.t_turnover),
          tPrize: dec(item.t_prize),
          tWinLose: dec(item.t_win_lose),
          raw: item as object,
          syncedAt: new Date(),
        },
      });
      count++;
    } catch (err) {
      logger.warn("upsertReportThirdGame failed", { username, reportDate, error: (err as Error).message });
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// 10. ProxyBank — upstreamId unique
// ---------------------------------------------------------------------------

async function upsertBanks(prisma: PrismaClient, agentId: string, items: Item[]): Promise<number> {
  let count = 0;
  for (const item of items) {
    const upstreamId = str(item.id);
    if (!upstreamId) continue;
    try {
      await prisma.proxyBank.upsert({
        where: { upstreamId },
        create: {
          agentId,
          upstreamId,
          isDefault: str(item.is_default_format),
          bankName: str(item.bank_name),
          bankBranch: str(item.bank_branch),
          cardNo: str(item.card_no),
          name: str(item.name),
          raw: item as object,
          syncedAt: new Date(),
        },
        update: {
          agentId,
          isDefault: str(item.is_default_format),
          bankName: str(item.bank_name),
          bankBranch: str(item.bank_branch),
          cardNo: str(item.card_no),
          name: str(item.name),
          raw: item as object,
          syncedAt: new Date(),
        },
      });
      count++;
    } catch (err) {
      logger.warn("upsertBanks failed", { upstreamId, error: (err as Error).message });
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// Registry — maps table name to upsert function
// ---------------------------------------------------------------------------

export const UPSERT_REGISTRY: Record<string, UpsertFn> = {
  proxyUser: upsertUsers,
  proxyInvite: upsertInvites,
  proxyDeposit: upsertDeposits,
  proxyWithdrawal: upsertWithdrawals,
  proxyBet: upsertBets,
  proxyBetOrder: upsertBetOrders,
  proxyReportLottery: upsertReportLottery,
  proxyReportFunds: upsertReportFunds,
  proxyReportThirdGame: upsertReportThirdGame,
  proxyBank: upsertBanks,
};
