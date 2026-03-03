import type { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
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

// ---------------------------------------------------------------------------
// Generic Bulk Upsert — raw SQL INSERT ... ON CONFLICT ... DO UPDATE
// PostgreSQL max bind params = 32767.  Batch size auto-calculated.
// ~30-60x faster than Prisma individual upserts.
// ---------------------------------------------------------------------------

interface BulkUpsertConfig {
  table: string;
  /** All columns INCLUDING id */
  columns: string[];
  /** SQL conflict target, e.g. "(agent_id, username)" */
  conflictTarget: string;
  /** Columns to update on conflict (excludes id and conflict keys) */
  updateColumns: string[];
  /** Columns that need ::timestamp cast */
  timestampColumns?: Set<string>;
  /** Columns that need ::jsonb cast */
  jsonbColumns?: Set<string>;
  /**
   * Column dùng để skip UPDATE khi data không đổi.
   * Thêm WHERE "table"."col" IS DISTINCT FROM EXCLUDED."col" vào SQL.
   * Giảm I/O cho PostgreSQL — row không thay đổi = zero write.
   */
  skipUnchangedColumn?: string;
}

async function bulkUpsert(
  prisma: PrismaClient,
  config: BulkUpsertConfig,
  rows: unknown[][],
): Promise<number> {
  if (rows.length === 0) return 0;

  const colCount = config.columns.length;
  const maxBatch = Math.floor(32767 / colCount);
  const batchSize = Math.min(maxBatch, 2000);
  let total = 0;

  const tsSet = config.timestampColumns ?? new Set<string>();
  const jsonSet = config.jsonbColumns ?? new Set<string>();

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const values: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    for (const row of batch) {
      const placeholders: string[] = [];
      for (let c = 0; c < colCount; c++) {
        const col = config.columns[c];
        let ph = `$${idx}`;
        if (tsSet.has(col)) ph += "::timestamp";
        if (jsonSet.has(col)) ph += "::jsonb";
        placeholders.push(ph);
        params.push(row[c]);
        idx++;
      }
      values.push(`(${placeholders.join(",")})`);
    }

    const updateSet = config.updateColumns
      .map((c) => `"${c}" = EXCLUDED."${c}"`)
      .join(", ");

    // WHERE clause: skip UPDATE nếu data không đổi (giảm I/O cho PostgreSQL)
    const whereClause = config.skipUnchangedColumn
      ? `\nWHERE "${config.table}"."${config.skipUnchangedColumn}" IS DISTINCT FROM EXCLUDED."${config.skipUnchangedColumn}"`
      : "";

    const sql = `INSERT INTO "${config.table}" (${config.columns.map((c) => `"${c}"`).join(",")})
VALUES ${values.join(",")}
ON CONFLICT ${config.conflictTarget}
DO UPDATE SET ${updateSet}${whereClause}`;

    try {
      await prisma.$executeRawUnsafe(sql, ...params);
      total += batch.length;
    } catch (err) {
      logger.error(`[BulkUpsert] ${config.table} batch failed`, {
        batchStart: i,
        batchSize: batch.length,
        error: (err as Error).message,
      });
    }
  }

  return total;
}

// ---------------------------------------------------------------------------
// Bulk Upsert with Change Detection — RETURNING (xmax = 0) AS is_new
// Dùng cho tables cần biết row nào mới/thay đổi (vd: proxy_users).
// PostgreSQL xmax = 0 → row vừa INSERT (mới hoàn toàn).
// xmax != 0 → row được UPDATE (data thay đổi).
// Rows unchanged (WHERE clause ngăn UPDATE) → KHÔNG trả về.
// ---------------------------------------------------------------------------

interface DetectResult {
  count: number;
  /** Usernames (or key field) of newly inserted rows */
  newKeys: string[];
  /** Usernames (or key field) of updated (changed) rows */
  changedKeys: string[];
}

async function bulkUpsertDetect(
  prisma: PrismaClient,
  config: BulkUpsertConfig,
  rows: unknown[][],
  /** Column name to return as the detection key (e.g. "username") */
  keyColumn: string,
): Promise<DetectResult> {
  if (rows.length === 0) return { count: 0, newKeys: [], changedKeys: [] };

  const colCount = config.columns.length;
  const maxBatch = Math.floor(32767 / colCount);
  const batchSize = Math.min(maxBatch, 2000);
  let total = 0;
  const newKeys: string[] = [];
  const changedKeys: string[] = [];

  const tsSet = config.timestampColumns ?? new Set<string>();
  const jsonSet = config.jsonbColumns ?? new Set<string>();

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const values: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    for (const row of batch) {
      const placeholders: string[] = [];
      for (let c = 0; c < colCount; c++) {
        const col = config.columns[c];
        let ph = `$${idx}`;
        if (tsSet.has(col)) ph += "::timestamp";
        if (jsonSet.has(col)) ph += "::jsonb";
        placeholders.push(ph);
        params.push(row[c]);
        idx++;
      }
      values.push(`(${placeholders.join(",")})`);
    }

    const updateSet = config.updateColumns
      .map((c) => `"${c}" = EXCLUDED."${c}"`)
      .join(", ");

    const whereClause = config.skipUnchangedColumn
      ? `\nWHERE "${config.table}"."${config.skipUnchangedColumn}" IS DISTINCT FROM EXCLUDED."${config.skipUnchangedColumn}"`
      : "";

    const sql = `INSERT INTO "${config.table}" (${config.columns.map((c) => `"${c}"`).join(",")})
VALUES ${values.join(",")}
ON CONFLICT ${config.conflictTarget}
DO UPDATE SET ${updateSet}${whereClause}
RETURNING "${keyColumn}", (xmax = 0) AS is_new`;

    try {
      const result = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(sql, ...params);
      total += batch.length;
      for (const row of result) {
        const key = String(row[keyColumn] ?? "");
        if (row.is_new) {
          newKeys.push(key);
        } else {
          changedKeys.push(key);
        }
      }
    } catch (err) {
      logger.error(`[BulkUpsertDetect] ${config.table} batch failed`, {
        batchStart: i,
        batchSize: batch.length,
        error: (err as Error).message,
      });
    }
  }

  return { count: total, newKeys, changedKeys };
}

// ---------------------------------------------------------------------------
// 1. ProxyUser — (agentId, username) composite unique
// ---------------------------------------------------------------------------

const PROXY_USER_CONFIG: BulkUpsertConfig = {
  table: "proxy_users",
  columns: ["id", "agent_id", "username", "type_format", "parent_user", "money", "deposit_count", "withdrawal_count", "deposit_amount", "withdrawal_amount", "login_time", "register_time", "status_format", "raw", "synced_at"],
  conflictTarget: "(agent_id, username)",
  updateColumns: ["type_format", "parent_user", "money", "deposit_count", "withdrawal_count", "deposit_amount", "withdrawal_amount", "login_time", "register_time", "status_format", "raw", "synced_at"],
  timestampColumns: new Set(["synced_at"]),
  jsonbColumns: new Set(["raw"]),
  skipUnchangedColumn: "raw",
};

async function upsertUsers(prisma: PrismaClient, agentId: string, items: Item[]): Promise<number> {
  if (items.length === 0) return 0;

  // 1. Lấy tổng số member hiện tại (để check first sync + safety threshold)
  const existingCount = await prisma.proxyUser.count({ where: { agentId } });

  // 2. Build upstream username→money map
  const upstreamMoneyMap = new Map<string, string | null>();
  for (const item of items) {
    const username = str(item.username);
    if (username) upstreamMoneyMap.set(username, str(item.money));
  }

  // 3. Bulk upsert với RETURNING — PostgreSQL cho biết row nào INSERT (mới) vs UPDATE (đổi)
  const now = new Date().toISOString();
  const rows: unknown[][] = [];
  for (const item of items) {
    const username = str(item.username);
    if (!username) continue;
    rows.push([
      randomUUID(), agentId, username,
      str(item.type_format), str(item.parent_user), dec(item.money),
      int(item.deposit_count), int(item.withdrawal_count),
      dec(item.deposit_amount), dec(item.withdrawal_amount),
      str(item.login_time), str(item.register_time), str(item.status_format),
      JSON.stringify(item), now,
    ]);
  }
  const { count, newKeys } = await bulkUpsertDetect(prisma, PROXY_USER_CONFIG, rows, "username");

  // New members: PostgreSQL xmax=0 → row vừa INSERT (100% chính xác, không cần pre-fetch)
  const newMembers = newKeys.map((username) => ({
    username,
    money: upstreamMoneyMap.get(username) ?? null,
  }));

  // 4. Detect lost members: query DB tìm member có trong DB nhưng KHÔNG có trong upstream
  const upstreamUsernames = [...upstreamMoneyMap.keys()];
  let lostMembers: Array<{ username: string; money: string | null }> = [];
  if (existingCount > 0 && upstreamUsernames.length > 0) {
    const lostRows = await prisma.$queryRawUnsafe<Array<{ username: string; money: string | null }>>(
      `SELECT username, money::text as money FROM "proxy_users"
       WHERE "agent_id" = $1 AND NOT (username = ANY($2::text[]))`,
      agentId,
      upstreamUsernames,
    );
    lostMembers = lostRows;
  }

  // 5. Notifications
  if (existingCount === 0) {
    if (newMembers.length > 0) {
      logger.info(`[Sync] First sync for agent ${agentId}: ${newMembers.length} members imported, no notifications created`);
    }
    return count;
  }

  const lostRatio = existingCount > 0 ? lostMembers.length / existingCount : 0;
  const safeLostMembers = lostRatio > 0.5 ? [] : lostMembers;
  if (lostRatio > 0.5 && lostMembers.length > 0) {
    logger.warn(
      `[Sync] Suspicious member loss: ${lostMembers.length}/${existingCount} (${(lostRatio * 100).toFixed(0)}%) for agent ${agentId} — skipping lost deletion & notifications`,
    );
  }

  // 6. Delete lost members from proxy_users — upstream không còn thì DB cũng xoá
  if (safeLostMembers.length > 0) {
    const lostUsernames = safeLostMembers.map((m) => m.username);
    try {
      const deleted = await prisma.proxyUser.deleteMany({
        where: {
          agentId,
          username: { in: lostUsernames },
        },
      });
      logger.info(
        `[Sync] Deleted ${deleted.count} lost members from proxy_users (agent: ${agentId})`,
      );
    } catch (err) {
      logger.error("[Sync] Failed to delete lost members", {
        agentId,
        count: lostUsernames.length,
        error: (err as Error).message,
      });
    }
  }

  // 7. Notifications for new + lost members
  if (newMembers.length > 0 || safeLostMembers.length > 0) {
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
          `[Sync] Member changes: +${newMembers.length} new, -${safeLostMembers.length} lost (agent: ${agentId}, notifs: ${notifs.length})`,
        );
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

/**
 * Phiên bản đơn giản của upsertUsers — KHÔNG có change detection (new/lost member).
 * Dùng cho write-through từ proxy.service khi search hit upstream.
 * Tránh false positive "lost member" khi chỉ có 10-20 items từ 1 trang search.
 */
export async function upsertUsersSimple(prisma: PrismaClient, agentId: string, items: Item[]): Promise<number> {
  if (items.length === 0) return 0;
  const now = new Date().toISOString();
  const rows: unknown[][] = [];
  for (const item of items) {
    const username = str(item.username);
    if (!username) continue;
    rows.push([
      randomUUID(), agentId, username,
      str(item.type_format), str(item.parent_user), dec(item.money),
      int(item.deposit_count), int(item.withdrawal_count),
      dec(item.deposit_amount), dec(item.withdrawal_amount),
      str(item.login_time), str(item.register_time), str(item.status_format),
      JSON.stringify(item), now,
    ]);
  }
  return bulkUpsert(prisma, PROXY_USER_CONFIG, rows);
}

// ---------------------------------------------------------------------------
// 2. ProxyInvite — (agentId, inviteCode) unique
// ---------------------------------------------------------------------------

const PROXY_INVITE_CONFIG: BulkUpsertConfig = {
  table: "proxy_invites",
  columns: ["id", "agent_id", "invite_code", "user_type", "reg_count", "scope_reg_count", "recharge_count", "first_recharge_count", "register_recharge_count", "remark", "create_time", "raw", "synced_at"],
  conflictTarget: "(agent_id, invite_code)",
  updateColumns: ["user_type", "reg_count", "scope_reg_count", "recharge_count", "first_recharge_count", "register_recharge_count", "remark", "create_time", "raw", "synced_at"],
  timestampColumns: new Set(["synced_at"]),
  jsonbColumns: new Set(["raw"]),
  skipUnchangedColumn: "raw",
};

async function upsertInvites(prisma: PrismaClient, agentId: string, items: Item[]): Promise<number> {
  const now = new Date().toISOString();
  const rows: unknown[][] = [];
  for (const item of items) {
    const inviteCode = str(item.invite_code);
    if (!inviteCode) continue;
    rows.push([
      randomUUID(), agentId, inviteCode,
      str(item.user_type), int(item.reg_count), int(item.scope_reg_count),
      int(item.recharge_count), int(item.first_recharge_count), int(item.register_recharge_count),
      str(item.remark), str(item.create_time),
      JSON.stringify(item), now,
    ]);
  }
  return bulkUpsert(prisma, PROXY_INVITE_CONFIG, rows);
}

// ---------------------------------------------------------------------------
// 3. ProxyDeposit — (agentId, username, amount, type, createTime) unique
// ---------------------------------------------------------------------------

const PROXY_DEPOSIT_CONFIG: BulkUpsertConfig = {
  table: "proxy_deposits",
  columns: ["id", "agent_id", "username", "user_parent_format", "amount", "type", "status", "create_time", "sync_date", "raw", "synced_at"],
  conflictTarget: "(agent_id, username, amount, type, create_time)",
  updateColumns: ["user_parent_format", "status", "sync_date", "raw", "synced_at"],
  timestampColumns: new Set(["synced_at"]),
  jsonbColumns: new Set(["raw"]),
  skipUnchangedColumn: "raw",
};

async function upsertDeposits(prisma: PrismaClient, agentId: string, items: Item[], syncDate?: string): Promise<number> {
  const now = new Date().toISOString();
  const rows: unknown[][] = [];
  for (const item of items) {
    const username = str(item.username);
    const createTime = str(item.create_time);
    if (!username || !createTime) continue;
    rows.push([
      randomUUID(), agentId, username,
      str(item.user_parent_format), dec(item.amount) ?? 0, str(item.type) ?? "",
      str(item.status), createTime, syncDate ?? null,
      JSON.stringify(item), now,
    ]);
  }
  return bulkUpsert(prisma, PROXY_DEPOSIT_CONFIG, rows);
}

// ---------------------------------------------------------------------------
// 4. ProxyWithdrawal — serialNo unique
// ---------------------------------------------------------------------------

const PROXY_WITHDRAWAL_CONFIG: BulkUpsertConfig = {
  table: "proxy_withdrawals",
  columns: ["id", "agent_id", "serial_no", "username", "user_parent_format", "amount", "user_fee", "true_amount", "status_format", "create_time", "sync_date", "raw", "synced_at"],
  conflictTarget: "(serial_no)",
  updateColumns: ["username", "user_parent_format", "amount", "user_fee", "true_amount", "status_format", "create_time", "sync_date", "raw", "synced_at"],
  timestampColumns: new Set(["synced_at"]),
  jsonbColumns: new Set(["raw"]),
  skipUnchangedColumn: "raw",
};

async function upsertWithdrawals(prisma: PrismaClient, agentId: string, items: Item[], syncDate?: string): Promise<number> {
  const now = new Date().toISOString();
  const rows: unknown[][] = [];
  for (const item of items) {
    const serialNo = str(item.serial_no);
    if (!serialNo) continue;
    rows.push([
      randomUUID(), agentId, serialNo,
      str(item.username) ?? "", str(item.user_parent_format),
      dec(item.amount), dec(item.user_fee), dec(item.true_amount),
      str(item.status_format), str(item.create_time), syncDate ?? null,
      JSON.stringify(item), now,
    ]);
  }
  return bulkUpsert(prisma, PROXY_WITHDRAWAL_CONFIG, rows);
}

// ---------------------------------------------------------------------------
// 5. ProxyBet — serialNo unique
// ---------------------------------------------------------------------------

const PROXY_BET_CONFIG: BulkUpsertConfig = {
  table: "proxy_bets",
  columns: ["id", "agent_id", "serial_no", "username", "lottery_name", "play_type_name", "play_name", "issue", "content", "money", "rebate_amount", "result", "status_text", "create_time", "sync_date", "raw", "synced_at"],
  conflictTarget: "(serial_no)",
  updateColumns: ["username", "lottery_name", "play_type_name", "play_name", "issue", "content", "money", "rebate_amount", "result", "status_text", "create_time", "sync_date", "raw", "synced_at"],
  timestampColumns: new Set(["synced_at"]),
  jsonbColumns: new Set(["raw"]),
  skipUnchangedColumn: "raw",
};

async function upsertBets(prisma: PrismaClient, agentId: string, items: Item[], syncDate?: string): Promise<number> {
  const now = new Date().toISOString();
  // Deduplicate by serial_no — upstream có thể trả trùng trong cùng 1 response
  const seen = new Set<string>();
  const rows: unknown[][] = [];
  for (const item of items) {
    const serialNo = str(item.serial_no);
    if (!serialNo || seen.has(serialNo)) continue;
    seen.add(serialNo);
    rows.push([
      randomUUID(), agentId, serialNo,
      str(item.username) ?? "", str(item.lottery_name), str(item.play_type_name),
      str(item.play_name), str(item.issue), str(item.content),
      dec(item.money), dec(item.rebate_amount), dec(item.result),
      str(item.status_text), str(item.create_time), syncDate ?? null,
      JSON.stringify(item), now,
    ]);
  }
  return bulkUpsert(prisma, PROXY_BET_CONFIG, rows);
}

// ---------------------------------------------------------------------------
// 6. ProxyBetOrder — serialNo unique
// ---------------------------------------------------------------------------

const PROXY_BET_ORDER_CONFIG: BulkUpsertConfig = {
  table: "proxy_bet_orders",
  columns: ["id", "agent_id", "serial_no", "platform_id_name", "platform_username", "c_name", "game_name", "bet_amount", "turnover", "prize", "win_lose", "bet_time", "sync_date", "raw", "synced_at"],
  conflictTarget: "(serial_no)",
  updateColumns: ["platform_id_name", "platform_username", "c_name", "game_name", "bet_amount", "turnover", "prize", "win_lose", "bet_time", "sync_date", "raw", "synced_at"],
  timestampColumns: new Set(["synced_at"]),
  jsonbColumns: new Set(["raw"]),
  skipUnchangedColumn: "raw",
};

async function upsertBetOrders(prisma: PrismaClient, agentId: string, items: Item[], syncDate?: string): Promise<number> {
  const now = new Date().toISOString();
  // Deduplicate by serial_no — upstream có thể trả trùng trong cùng 1 response
  const seen = new Set<string>();
  const rows: unknown[][] = [];
  for (const item of items) {
    const serialNo = str(item.serial_no);
    if (!serialNo || seen.has(serialNo)) continue;
    seen.add(serialNo);
    rows.push([
      randomUUID(), agentId, serialNo,
      str(item.platform_id_name), str(item.platform_username),
      str(item.c_name), str(item.game_name),
      dec(item.bet_amount), dec(item.turnover), dec(item.prize), dec(item.win_lose),
      str(item.bet_time), syncDate ?? null,
      JSON.stringify(item), now,
    ]);
  }
  return bulkUpsert(prisma, PROXY_BET_ORDER_CONFIG, rows);
}

// ---------------------------------------------------------------------------
// 7. ProxyReportLottery — (agentId, username, lotteryName, reportDate) unique
// ---------------------------------------------------------------------------

const PROXY_REPORT_LOTTERY_CONFIG: BulkUpsertConfig = {
  table: "proxy_report_lottery",
  columns: ["id", "agent_id", "username", "user_parent_format", "lottery_name", "bet_count", "bet_amount", "valid_amount", "rebate_amount", "result", "win_lose", "prize", "report_date", "raw", "synced_at"],
  conflictTarget: "(agent_id, username, lottery_name, report_date)",
  updateColumns: ["user_parent_format", "bet_count", "bet_amount", "valid_amount", "rebate_amount", "result", "win_lose", "prize", "raw", "synced_at"],
  timestampColumns: new Set(["synced_at"]),
  jsonbColumns: new Set(["raw"]),
  skipUnchangedColumn: "raw",
};

async function upsertReportLottery(prisma: PrismaClient, agentId: string, items: Item[], syncDate?: string): Promise<number> {
  const now = new Date().toISOString();
  const rows: unknown[][] = [];
  for (const item of items) {
    const username = str(item.username);
    const lotteryName = str(item.lottery_name);
    const reportDate = str(item.date) ?? str(item.report_date) ?? syncDate ?? null;
    if (!username || !lotteryName || !reportDate) continue;
    rows.push([
      randomUUID(), agentId, username,
      str(item.user_parent_format), lotteryName,
      int(item.bet_count), dec(item.bet_amount), dec(item.valid_amount),
      dec(item.rebate_amount), dec(item.result), dec(item.win_lose), dec(item.prize),
      reportDate,
      JSON.stringify(item), now,
    ]);
  }
  return bulkUpsert(prisma, PROXY_REPORT_LOTTERY_CONFIG, rows);
}

// ---------------------------------------------------------------------------
// 8. ProxyReportFunds — (agentId, username, reportDate) unique
// ---------------------------------------------------------------------------

const PROXY_REPORT_FUNDS_CONFIG: BulkUpsertConfig = {
  table: "proxy_report_funds",
  columns: ["id", "agent_id", "username", "user_parent_format", "deposit_count", "deposit_amount", "withdrawal_count", "withdrawal_amount", "charge_fee", "agent_commission", "promotion", "third_rebate", "third_activity_amount", "report_date", "raw", "synced_at"],
  conflictTarget: "(agent_id, username, report_date)",
  updateColumns: ["user_parent_format", "deposit_count", "deposit_amount", "withdrawal_count", "withdrawal_amount", "charge_fee", "agent_commission", "promotion", "third_rebate", "third_activity_amount", "raw", "synced_at"],
  timestampColumns: new Set(["synced_at"]),
  jsonbColumns: new Set(["raw"]),
  skipUnchangedColumn: "raw",
};

async function upsertReportFunds(prisma: PrismaClient, agentId: string, items: Item[]): Promise<number> {
  const now = new Date().toISOString();
  const rows: unknown[][] = [];
  for (const item of items) {
    const username = str(item.username);
    const reportDate = str(item.date) ?? str(item.report_date);
    if (!username || !reportDate) continue;
    rows.push([
      randomUUID(), agentId, username,
      str(item.user_parent_format),
      int(item.deposit_count), dec(item.deposit_amount),
      int(item.withdrawal_count), dec(item.withdrawal_amount),
      dec(item.charge_fee), dec(item.agent_commission), dec(item.promotion),
      dec(item.third_rebate), dec(item.third_activity_amount),
      reportDate,
      JSON.stringify(item), now,
    ]);
  }
  return bulkUpsert(prisma, PROXY_REPORT_FUNDS_CONFIG, rows);
}

// ---------------------------------------------------------------------------
// 9. ProxyReportThirdGame — (agentId, username, platformIdName, reportDate) unique
// ---------------------------------------------------------------------------

const PROXY_REPORT_THIRD_GAME_CONFIG: BulkUpsertConfig = {
  table: "proxy_report_third_game",
  columns: ["id", "agent_id", "username", "platform_id_name", "t_bet_times", "t_bet_amount", "t_turnover", "t_prize", "t_win_lose", "report_date", "raw", "synced_at"],
  conflictTarget: "(agent_id, username, platform_id_name, report_date)",
  updateColumns: ["t_bet_times", "t_bet_amount", "t_turnover", "t_prize", "t_win_lose", "raw", "synced_at"],
  timestampColumns: new Set(["synced_at"]),
  jsonbColumns: new Set(["raw"]),
  skipUnchangedColumn: "raw",
};

async function upsertReportThirdGame(prisma: PrismaClient, agentId: string, items: Item[], syncDate?: string): Promise<number> {
  const now = new Date().toISOString();
  const rows: unknown[][] = [];
  for (const item of items) {
    const username = str(item.username);
    const platformIdName = str(item.platform_id_name);
    const reportDate = str(item.date) ?? str(item.report_date) ?? syncDate ?? null;
    if (!username || !platformIdName || !reportDate) continue;
    rows.push([
      randomUUID(), agentId, username, platformIdName,
      int(item.t_bet_times), dec(item.t_bet_amount), dec(item.t_turnover),
      dec(item.t_prize), dec(item.t_win_lose),
      reportDate,
      JSON.stringify(item), now,
    ]);
  }
  return bulkUpsert(prisma, PROXY_REPORT_THIRD_GAME_CONFIG, rows);
}

// ---------------------------------------------------------------------------
// 10. ProxyBank — upstreamId unique
// ---------------------------------------------------------------------------

const PROXY_BANK_CONFIG: BulkUpsertConfig = {
  table: "proxy_banks",
  columns: ["id", "agent_id", "upstream_id", "is_default_format", "bank_name", "bank_branch", "card_no", "name", "raw", "synced_at"],
  conflictTarget: "(upstream_id)",
  updateColumns: ["agent_id", "is_default_format", "bank_name", "bank_branch", "card_no", "name", "raw", "synced_at"],
  timestampColumns: new Set(["synced_at"]),
  jsonbColumns: new Set(["raw"]),
  skipUnchangedColumn: "raw",
};

async function upsertBanks(prisma: PrismaClient, agentId: string, items: Item[]): Promise<number> {
  const now = new Date().toISOString();
  const rows: unknown[][] = [];
  for (const item of items) {
    const upstreamId = str(item.id);
    if (!upstreamId) continue;
    rows.push([
      randomUUID(), agentId, upstreamId,
      str(item.is_default_format), str(item.bank_name), str(item.bank_branch),
      str(item.card_no), str(item.name),
      JSON.stringify(item), now,
    ]);
  }
  return bulkUpsert(prisma, PROXY_BANK_CONFIG, rows);
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
