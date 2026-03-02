import type { PrismaClient } from "@prisma/client";
import { logger } from "../../utils/logger.js";
import { wsManager } from "../../websocket/ws.manager.js";

type Item = Record<string, unknown>;

/**
 * UpsertFn signature — syncDate is the date string (YYYY-MM-DD) that was used
 * as the fetch parameter for this batch.  For date-range endpoints the sync
 * engine passes it so we can store it as metadata; for non-date endpoints
 * (user, invite, bank) it is undefined.
 */
type UpsertFn = (prisma: PrismaClient, agentId: string, items: Item[], syncDate?: string) => Promise<number>;

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

/**
 * Generic upsert loop — DRY wrapper for the repeated for/try/catch/logger pattern.
 */
async function upsertLoop<T>(
  items: Item[],
  label: string,
  extractKey: (item: Item) => T | null,
  doUpsert: (key: T, item: Item) => Promise<void>,
): Promise<number> {
  let count = 0;
  for (const item of items) {
    const key = extractKey(item);
    if (key == null) continue;
    try {
      await doUpsert(key, item);
      count++;
    } catch (err) {
      logger.warn(`${label} failed`, { key, error: (err as Error).message });
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// 1. ProxyUser — (agentId, username) composite unique
// ---------------------------------------------------------------------------

async function upsertUsers(prisma: PrismaClient, agentId: string, items: Item[]): Promise<number> {
  // Skip change detection if upstream returned empty (likely error/timeout)
  if (items.length === 0) return 0;

  // 1. Fetch existing members for this agent
  const existing = await prisma.proxyUser.findMany({
    where: { agentId },
    select: { username: true, money: true },
  });
  const existingMap = new Map(existing.map((u) => [u.username, u.money]));

  // 2. Build upstream username→money map
  const upstreamMap = new Map<string, string | null>();
  for (const item of items) {
    const username = str(item.username);
    if (username) upstreamMap.set(username, str(item.money));
  }

  // 3. Detect new members (in upstream but not in DB)
  const newMembers: Array<{ username: string; money: string | null }> = [];
  for (const [username, money] of upstreamMap) {
    if (!existingMap.has(username)) {
      newMembers.push({ username, money });
    }
  }

  // 4. Detect lost members (in DB but not in upstream)
  const lostMembers: Array<{ username: string; money: string | null }> = [];
  for (const [username, money] of existingMap) {
    if (!upstreamMap.has(username)) {
      lostMembers.push({ username, money: money != null ? String(money) : null });
    }
  }

  // 5. Upsert all items as before
  const count = await upsertLoop(items, "upsertUsers", (item) => str(item.username), async (username, item) => {
    const data = {
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
    };
    await prisma.proxyUser.upsert({
      where: { uq_proxy_user: { agentId, username } },
      create: { ...data, username },
      update: data,
    });
  });

  // 6. Create notifications for member changes (with safeguards)
  // Safeguard A: Lần đầu sync (DB chưa có member) → skip hết, không tạo notification
  if (existingMap.size === 0) {
    if (newMembers.length > 0) {
      logger.info(`[Sync] First sync for agent ${agentId}: ${newMembers.length} members imported, no notifications created`);
    }
    return count;
  }

  // Safeguard B: Nếu mất >50% member → upstream có thể bị lỗi/trả thiếu, skip "member_lost"
  const lostRatio = existingMap.size > 0 ? lostMembers.length / existingMap.size : 0;
  const safeLostMembers = lostRatio > 0.5 ? [] : lostMembers;
  if (lostRatio > 0.5 && lostMembers.length > 0) {
    logger.warn(
      `[Sync] Suspicious member loss: ${lostMembers.length}/${existingMap.size} (${(lostRatio * 100).toFixed(0)}%) for agent ${agentId} — skipping lost notifications`,
    );
  }

  if (newMembers.length > 0 || safeLostMembers.length > 0) {
    // Safeguard C: Chống trùng lặp — check notification đã tồn tại chưa (cùng agent + type + username trong 24h)
    const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const allUsernames = [
      ...newMembers.map((m) => m.username),
      ...safeLostMembers.map((m) => m.username),
    ];

    const existingNotifs = await prisma.notification.findMany({
      where: {
        agentId,
        username: { in: allUsernames },
        createdAt: { gte: cutoff24h },
      },
      select: { type: true, username: true },
    });
    const existingNotifSet = new Set(existingNotifs.map((n) => `${n.type}:${n.username}`));

    const notifs = [
      ...newMembers
        .filter((m) => !existingNotifSet.has(`member_new:${m.username}`))
        .map((m) => ({
          agentId,
          type: "member_new" as const,
          username: m.username,
          money: m.money,
        })),
      ...safeLostMembers
        .filter((m) => !existingNotifSet.has(`member_lost:${m.username}`))
        .map((m) => ({
          agentId,
          type: "member_lost" as const,
          username: m.username,
          money: m.money,
        })),
    ];

    if (notifs.length > 0) {
      try {
        await prisma.notification.createMany({ data: notifs });
        logger.info(
          `[Sync] Member changes detected: +${newMembers.length} new, -${safeLostMembers.length} lost (agent: ${agentId}, notifs created: ${notifs.length})`,
        );

        // Broadcast via WebSocket so frontend can refresh
        wsManager.broadcast({
          type: "notifications",
          newCount: newMembers.length,
          lostCount: safeLostMembers.length,
          agentId,
        });
      } catch (err) {
        logger.warn("Failed to create member change notifications", {
          error: (err as Error).message,
        });
      }
    }
  }

  return count;
}

// ---------------------------------------------------------------------------
// 2. ProxyInvite — (agentId, inviteCode) unique
// ---------------------------------------------------------------------------

async function upsertInvites(prisma: PrismaClient, agentId: string, items: Item[]): Promise<number> {
  return upsertLoop(items, "upsertInvites", (item) => str(item.invite_code), async (inviteCode, item) => {
    const data = {
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
    };
    await prisma.proxyInvite.upsert({
      where: { uq_invite: { agentId, inviteCode } },
      create: { ...data, agentId, inviteCode },
      update: data,
    });
  });
}

// ---------------------------------------------------------------------------
// 3. ProxyDeposit — (agentId, username, amount, type, createTime) unique
//    syncDate = ngày được dùng làm tham số fetch upstream
// ---------------------------------------------------------------------------

async function upsertDeposits(prisma: PrismaClient, agentId: string, items: Item[], syncDate?: string): Promise<number> {
  return upsertLoop(
    items,
    "upsertDeposits",
    (item) => {
      const username = str(item.username);
      const createTime = str(item.create_time);
      return username && createTime ? { username, createTime } : null;
    },
    async ({ username, createTime }, item) => {
      const amount = dec(item.amount);
      const type = str(item.type) ?? "";
      await prisma.proxyDeposit.upsert({
        where: { uq_deposit: { agentId, username, amount: amount ?? 0, type, createTime } },
        create: {
          agentId, username,
          userParentFormat: str(item.user_parent_format),
          amount, type, status: str(item.status), createTime,
          syncDate: syncDate ?? null,
          raw: item as object, syncedAt: new Date(),
        },
        update: {
          userParentFormat: str(item.user_parent_format),
          status: str(item.status),
          syncDate: syncDate ?? undefined,
          raw: item as object, syncedAt: new Date(),
        },
      });
    },
  );
}

// ---------------------------------------------------------------------------
// 4. ProxyWithdrawal — serialNo unique
// ---------------------------------------------------------------------------

async function upsertWithdrawals(prisma: PrismaClient, agentId: string, items: Item[], syncDate?: string): Promise<number> {
  return upsertLoop(items, "upsertWithdrawals", (item) => str(item.serial_no), async (serialNo, item) => {
    const data = {
      agentId,
      username: str(item.username) ?? "",
      userParentFormat: str(item.user_parent_format),
      amount: dec(item.amount),
      userFee: dec(item.user_fee),
      trueAmount: dec(item.true_amount),
      statusFormat: str(item.status_format),
      createTime: str(item.create_time),
      syncDate: syncDate ?? null,
      raw: item as object,
      syncedAt: new Date(),
    };
    await prisma.proxyWithdrawal.upsert({
      where: { serialNo },
      create: { ...data, serialNo },
      update: data,
    });
  });
}

// ---------------------------------------------------------------------------
// 5. ProxyBet — serialNo unique
// ---------------------------------------------------------------------------

async function upsertBets(prisma: PrismaClient, agentId: string, items: Item[], syncDate?: string): Promise<number> {
  return upsertLoop(items, "upsertBets", (item) => str(item.serial_no), async (serialNo, item) => {
    const data = {
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
      syncDate: syncDate ?? null,
      raw: item as object,
      syncedAt: new Date(),
    };
    await prisma.proxyBet.upsert({
      where: { serialNo },
      create: { ...data, serialNo },
      update: data,
    });
  });
}

// ---------------------------------------------------------------------------
// 6. ProxyBetOrder — serialNo unique
// ---------------------------------------------------------------------------

async function upsertBetOrders(prisma: PrismaClient, agentId: string, items: Item[], syncDate?: string): Promise<number> {
  return upsertLoop(items, "upsertBetOrders", (item) => str(item.serial_no), async (serialNo, item) => {
    const data = {
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
      syncDate: syncDate ?? null,
      raw: item as object,
      syncedAt: new Date(),
    };
    await prisma.proxyBetOrder.upsert({
      where: { serialNo },
      create: { ...data, serialNo },
      update: data,
    });
  });
}

// ---------------------------------------------------------------------------
// 7. ProxyReportLottery — (agentId, username, lotteryName, reportDate) unique
//    reportDate chính là metadata ngày, không cần thêm syncDate
// ---------------------------------------------------------------------------

async function upsertReportLottery(prisma: PrismaClient, agentId: string, items: Item[]): Promise<number> {
  return upsertLoop(
    items,
    "upsertReportLottery",
    (item) => {
      const username = str(item.username);
      const lotteryName = str(item.lottery_name);
      const reportDate = str(item.date) ?? str(item.report_date);
      return username && lotteryName && reportDate ? { username, lotteryName, reportDate } : null;
    },
    async ({ username, lotteryName, reportDate }, item) => {
      const data = {
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
      };
      await prisma.proxyReportLottery.upsert({
        where: { uq_report_lottery: { agentId, username, lotteryName, reportDate } },
        create: { ...data, agentId, username, lotteryName, reportDate },
        update: data,
      });
    },
  );
}

// ---------------------------------------------------------------------------
// 8. ProxyReportFunds — (agentId, username, reportDate) unique
// ---------------------------------------------------------------------------

async function upsertReportFunds(prisma: PrismaClient, agentId: string, items: Item[]): Promise<number> {
  return upsertLoop(
    items,
    "upsertReportFunds",
    (item) => {
      const username = str(item.username);
      const reportDate = str(item.date) ?? str(item.report_date);
      return username && reportDate ? { username, reportDate } : null;
    },
    async ({ username, reportDate }, item) => {
      const data = {
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
      };
      await prisma.proxyReportFunds.upsert({
        where: { uq_report_funds: { agentId, username, reportDate } },
        create: { ...data, agentId, username, reportDate },
        update: data,
      });
    },
  );
}

// ---------------------------------------------------------------------------
// 9. ProxyReportThirdGame — (agentId, username, platformIdName, reportDate) unique
// ---------------------------------------------------------------------------

async function upsertReportThirdGame(prisma: PrismaClient, agentId: string, items: Item[]): Promise<number> {
  return upsertLoop(
    items,
    "upsertReportThirdGame",
    (item) => {
      const username = str(item.username);
      const platformIdName = str(item.platform_id_name);
      const reportDate = str(item.date) ?? str(item.report_date);
      return username && platformIdName && reportDate ? { username, platformIdName, reportDate } : null;
    },
    async ({ username, platformIdName, reportDate }, item) => {
      const data = {
        tBetTimes: int(item.t_bet_times),
        tBetAmount: dec(item.t_bet_amount),
        tTurnover: dec(item.t_turnover),
        tPrize: dec(item.t_prize),
        tWinLose: dec(item.t_win_lose),
        raw: item as object,
        syncedAt: new Date(),
      };
      await prisma.proxyReportThirdGame.upsert({
        where: { uq_report_third_game: { agentId, username, platformIdName, reportDate } },
        create: { ...data, agentId, username, platformIdName, reportDate },
        update: data,
      });
    },
  );
}

// ---------------------------------------------------------------------------
// 10. ProxyBank — upstreamId unique
// ---------------------------------------------------------------------------

async function upsertBanks(prisma: PrismaClient, agentId: string, items: Item[]): Promise<number> {
  return upsertLoop(items, "upsertBanks", (item) => str(item.id), async (upstreamId, item) => {
    const data = {
      agentId,
      isDefault: str(item.is_default_format),
      bankName: str(item.bank_name),
      bankBranch: str(item.bank_branch),
      cardNo: str(item.card_no),
      name: str(item.name),
      raw: item as object,
      syncedAt: new Date(),
    };
    await prisma.proxyBank.upsert({
      where: { upstreamId },
      create: { ...data, upstreamId },
      update: data,
    });
  });
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
