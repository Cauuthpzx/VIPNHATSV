import type { FastifyInstance } from "fastify";
import { logger } from "../../utils/logger.js";

/**
 * Export config cho từng Prisma model.
 * dateField: trường ngày để filter (null = không filter theo ngày, VD: user list)
 * sortField: trường sort DESC
 */
interface ExportConfig {
  dateField: string | null;
  sortField: string;
  buildFilters: (params: ExportParams) => Record<string, unknown>;
}

interface ExportParams {
  startDate?: string;
  endDate?: string;
  username?: string;
  agentId?: string;
}

const EXPORT_CONFIGS: Record<string, ExportConfig> = {
  proxyReportFunds: {
    dateField: "reportDate",
    sortField: "reportDate",
    buildFilters: (p) => ({
      ...(p.username ? { username: { contains: p.username, mode: "insensitive" } } : {}),
    }),
  },
  proxyReportLottery: {
    dateField: "reportDate",
    sortField: "reportDate",
    buildFilters: (p) => ({
      ...(p.username ? { username: { contains: p.username, mode: "insensitive" } } : {}),
    }),
  },
  proxyReportThirdGame: {
    dateField: "reportDate",
    sortField: "reportDate",
    buildFilters: (p) => ({
      ...(p.username ? { username: { contains: p.username, mode: "insensitive" } } : {}),
    }),
  },
  proxyDeposit: {
    dateField: "syncDate",
    sortField: "createTime",
    buildFilters: (p) => ({
      ...(p.username ? { username: { contains: p.username, mode: "insensitive" } } : {}),
    }),
  },
  proxyWithdrawal: {
    dateField: "syncDate",
    sortField: "createTime",
    buildFilters: (p) => ({
      ...(p.username ? { username: { contains: p.username, mode: "insensitive" } } : {}),
    }),
  },
  proxyBet: {
    dateField: "syncDate",
    sortField: "createTime",
    buildFilters: (p) => ({
      ...(p.username ? { username: { contains: p.username, mode: "insensitive" } } : {}),
    }),
  },
  proxyBetOrder: {
    dateField: "syncDate",
    sortField: "betTime",
    buildFilters: (p) => ({
      ...(p.username ? { platformUsername: { contains: p.username, mode: "insensitive" } } : {}),
    }),
  },
  proxyUser: {
    dateField: null,
    sortField: "registerTime",
    buildFilters: (p) => ({
      ...(p.username ? { username: { contains: p.username, mode: "insensitive" } } : {}),
    }),
  },
};

/**
 * Export data từ DB local — trả về tất cả records (không phân trang, không giới hạn).
 */
export async function exportFromDb(
  app: FastifyInstance,
  userId: string,
  table: string,
  params: ExportParams,
): Promise<{ items: Record<string, unknown>[]; total: number }> {
  const config = EXPORT_CONFIGS[table];
  if (!config) {
    throw new Error(`Export không hỗ trợ table: ${table}`);
  }

  const prismaModel = (app.prisma as any)[table];
  if (!prismaModel) {
    throw new Error(`Prisma model not found: ${table}`);
  }

  // Resolve agent IDs
  const agents = await app.prisma.agent.findMany({
    where: { status: "active" },
    select: { id: true, name: true },
  });
  const agentNameMap = new Map(agents.map((a) => [a.id, a.name]));
  let agentIds = agents.map((a) => a.id);

  // Filter by specific agent if requested
  if (params.agentId) {
    agentIds = agentIds.filter((id) => id === params.agentId);
  }

  if (agentIds.length === 0) {
    return { items: [], total: 0 };
  }

  // Build where clause
  const where: Record<string, unknown> = {
    agentId: agentIds.length === 1 ? agentIds[0] : { in: agentIds },
    ...config.buildFilters(params),
  };

  // Date filter
  if (config.dateField && params.startDate && params.endDate) {
    where[config.dateField] = { gte: params.startDate, lte: params.endDate };
  }

  // Fetch all rows
  const rows = await prismaModel.findMany({
    where,
    orderBy: { [config.sortField]: "desc" },
    select: { raw: true, agentId: true },
  });

  // Map to upstream-compatible format
  const items = rows.map((row: any) => ({
    _agentName: agentNameMap.get(row.agentId) ?? "",
    ...(typeof row.raw === "object" ? row.raw : {}),
  }));

  logger.info("Export from DB", { table, total: items.length, userId });

  return { items, total: items.length };
}
