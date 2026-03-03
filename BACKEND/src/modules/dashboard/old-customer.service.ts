import type { FastifyInstance } from "fastify";
import * as XLSX from "xlsx";
import { logger } from "../../utils/logger.js";

// ===================================================================
// TYPES
// ===================================================================

export interface OldCustomerRow {
  id: string;
  assignedDate: string | null;
  employeeName: string;
  agentCode: string | null;
  username: string;
  contactInfo: string | null;
  source: string | null;
  referralAccount: string | null;
  firstDeposit: number | null;
  onlineDays: string[] | null;
  createdAt: Date;
}

export interface OldCustomerUploadResult {
  totalRows: number;
  insertedRows: number;
  skippedRows: number;
  employeeNames: string[];
  calendarMonths: CalendarMonth[];
}

export interface CalendarMonth {
  label: string; // "T11", "T12", "T1", ...
  days: number;  // 28-31
}

export interface OldCustomerSummary {
  totalCustomers: number;
  employees: { name: string; count: number }[];
  agents: { code: string; count: number }[];
  sources: { name: string; count: number }[];
  calendarMonths: CalendarMonth[];
}

// ===================================================================
// UPLOAD & PARSE
// ===================================================================

function excelDateToString(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    const epoch = new Date(1899, 11, 30);
    const d = new Date(epoch.getTime() + value * 86400000);
    return d.toISOString().slice(0, 10);
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return null;
}

function parseFirstDeposit(value: unknown): number | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const cleaned = value.trim().toLowerCase();
    if (cleaned.endsWith("k")) {
      const num = parseFloat(cleaned.slice(0, -1));
      return isNaN(num) ? null : num * 1000;
    }
    const num = parseFloat(cleaned.replace(/,/g, ""));
    return isNaN(num) ? null : num;
  }

  return null;
}

/** Parse header rows to build calendar month structure starting from col 9 */
function parseCalendarHeaders(headerRow: unknown[], subHeaderRow: unknown[]): {
  months: CalendarMonth[];
  colMap: { colIndex: number; monthLabel: string; day: number }[];
} {
  const months: CalendarMonth[] = [];
  const colMap: { colIndex: number; monthLabel: string; day: number }[] = [];

  // Use max of both header rows to determine extent
  const maxCol = Math.max(headerRow.length, subHeaderRow.length);

  let currentMonthLabel = "";
  let currentMonthDayCount = 0;

  for (let i = 9; i < maxCol; i++) {
    const h = headerRow[i];
    if (h !== null && h !== undefined && String(h).trim()) {
      // New month header found — save previous month
      if (currentMonthLabel && currentMonthDayCount > 0) {
        months.push({ label: currentMonthLabel, days: currentMonthDayCount });
      }
      const raw = String(h).trim();
      const m = raw.match(/(\d+)/);
      currentMonthLabel = m ? `T${m[1]}` : raw;
      currentMonthDayCount = 0;
    }
    if (currentMonthLabel) {
      currentMonthDayCount++;
      colMap.push({ colIndex: i, monthLabel: currentMonthLabel, day: currentMonthDayCount });
    }
  }
  // Push last month
  if (currentMonthLabel && currentMonthDayCount > 0) {
    months.push({ label: currentMonthLabel, days: currentMonthDayCount });
  }

  return { months, colMap };
}

export async function processOldCustomerUpload(
  app: FastifyInstance,
  buffer: Buffer,
): Promise<OldCustomerUploadResult> {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    range: 0,
  });

  const headerRow = (data[0] || []) as unknown[];
  const subHeaderRow = (data[1] || []) as unknown[];
  const { months: calendarMonths, colMap } = parseCalendarHeaders(headerRow, subHeaderRow);

  // Skip 2 header rows
  const dataRows = data.slice(2);

  interface ParsedRow {
    assignedDate: string | null;
    employeeName: string;
    agentCode: string | null;
    username: string;
    contactInfo: string | null;
    source: string | null;
    referralAccount: string | null;
    firstDeposit: number | null;
    onlineDays: string[];
  }

  const rows: ParsedRow[] = [];
  let lastDate: string | null = null;
  let lastEmployee: string | null = null;
  let skipped = 0;

  for (const row of dataRows) {
    if (!row || !Array.isArray(row)) continue;

    const username = row[3];
    if (!username || typeof username !== "string" || !username.trim()) {
      skipped++;
      continue;
    }

    const dateVal = excelDateToString(row[0]);
    if (dateVal) lastDate = dateVal;

    const empName = row[1];
    if (empName && typeof empName === "string" && empName.trim()) {
      lastEmployee = empName.trim();
    }

    if (!lastEmployee) {
      skipped++;
      continue;
    }

    // Parse online days from calendar columns
    const onlineDays: string[] = [];
    for (const cm of colMap) {
      const val = row[cm.colIndex];
      if (val === "v" || val === "V" || val === "✓") {
        // Format: "T11-1", "T12-25", "T1-3"
        onlineDays.push(`${cm.monthLabel}-${cm.day}`);
      }
    }

    rows.push({
      assignedDate: lastDate,
      employeeName: lastEmployee,
      agentCode:
        row[2] !== null && row[2] !== undefined ? String(row[2]).trim() : null,
      username: username.trim().toLowerCase(),
      contactInfo:
        row[4] !== null && row[4] !== undefined
          ? String(row[4]).trim()
          : null,
      source:
        row[5] !== null && row[5] !== undefined
          ? String(row[5]).trim()
          : null,
      referralAccount:
        row[6] !== null && row[6] !== undefined
          ? String(row[6]).trim()
          : null,
      firstDeposit: parseFirstDeposit(row[8]),
      onlineDays,
    });
  }

  if (rows.length === 0) {
    return {
      totalRows: dataRows.length,
      insertedRows: 0,
      skippedRows: skipped,
      employeeNames: [],
      calendarMonths,
    };
  }

  // Delete all existing old_customers then bulk insert
  const BATCH_SIZE = 5000;
  let insertedCount = 0;

  await app.prisma.$transaction(async (tx) => {
    await tx.oldCustomer.deleteMany();

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const result = await tx.oldCustomer.createMany({
        data: batch.map((r) => ({
          assignedDate: r.assignedDate,
          employeeName: r.employeeName,
          agentCode: r.agentCode,
          username: r.username,
          contactInfo: r.contactInfo,
          source: r.source,
          referralAccount: r.referralAccount,
          firstDeposit: r.firstDeposit,
          onlineDays: r.onlineDays.length > 0 ? r.onlineDays : undefined,
        })),
        skipDuplicates: true,
      });
      insertedCount += result.count;
    }
  });

  // Save calendar structure to a simple key-value (reuse summary endpoint)
  // Store in Redis for quick access
  try {
    await app.redis.set(
      "old_customer:calendar_months",
      JSON.stringify(calendarMonths),
    );
  } catch {
    // non-critical
  }

  const employeeNames = [...new Set(rows.map((r) => r.employeeName))];

  logger.info(
    `[OldCustomer] Upload complete: ${insertedCount} inserted, ${skipped} skipped, ${employeeNames.length} employees, ${calendarMonths.length} months`,
  );

  return {
    totalRows: dataRows.length,
    insertedRows: insertedCount,
    skippedRows: skipped,
    employeeNames,
    calendarMonths,
  };
}

// ===================================================================
// NOTE — Thêm KH từ text paste
// ===================================================================

export interface NoteCustomerInput {
  assignedDate: string;
  employeeName: string;
  agentCode: string;
  username: string;
  contactInfo: string;
  source: string;
  referralAccount: string;
  firstDeposit: number | null;
}

export async function addNoteCustomers(
  app: FastifyInstance,
  customers: NoteCustomerInput[],
): Promise<{ insertedCount: number; skippedCount: number }> {
  const data = customers.map((c) => ({
    assignedDate: c.assignedDate || null,
    employeeName: c.employeeName || "—",
    agentCode: c.agentCode || null,
    username: c.username.trim().toLowerCase(),
    contactInfo: c.contactInfo || null,
    source: c.source || null,
    referralAccount: c.referralAccount || null,
    firstDeposit: c.firstDeposit,
  }));

  const result = await app.prisma.oldCustomer.createMany({
    data,
    skipDuplicates: true,
  });

  const skipped = data.length - result.count;

  logger.info(
    `[OldCustomer] Note add: ${result.count} inserted, ${skipped} skipped (duplicates)`,
  );

  return {
    insertedCount: result.count,
    skippedCount: skipped,
  };
}

// ===================================================================
// QUERY — List with pagination + filters
// ===================================================================

export interface OldCustomerListParams {
  page: number;
  limit: number;
  employee?: string;
  agentCode?: string;
  source?: string;
  search?: string;
}

export async function getOldCustomerList(
  app: FastifyInstance,
  params: OldCustomerListParams,
) {
  const { page, limit, employee, agentCode, source, search } = params;

  const where: Record<string, unknown> = {};
  if (employee) where.employeeName = employee;
  if (agentCode) where.agentCode = agentCode;
  if (source) where.source = { contains: source, mode: "insensitive" };
  if (search) {
    where.OR = [
      { username: { contains: search, mode: "insensitive" } },
      { contactInfo: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    app.prisma.oldCustomer.count({ where }),
    app.prisma.oldCustomer.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Retrieve calendar months from Redis
  let calendarMonths: CalendarMonth[] = [];
  try {
    const cached = await app.redis.get("old_customer:calendar_months");
    if (cached) calendarMonths = JSON.parse(cached);
  } catch {
    // non-critical
  }

  return { total, items, page, limit, calendarMonths };
}

// ===================================================================
// EXPORT — Trả tất cả records (không phân trang) cho xuất file
// ===================================================================

export interface OldCustomerExportParams {
  employee?: string;
  agentCode?: string;
  search?: string;
}

export async function exportOldCustomers(
  app: FastifyInstance,
  params: OldCustomerExportParams,
) {
  const { employee, agentCode, search } = params;

  const where: Record<string, unknown> = {};
  if (employee) where.employeeName = employee;
  if (agentCode) where.agentCode = agentCode;
  if (search) {
    where.OR = [
      { username: { contains: search, mode: "insensitive" } },
      { contactInfo: { contains: search, mode: "insensitive" } },
    ];
  }

  const items = await app.prisma.oldCustomer.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });

  let calendarMonths: CalendarMonth[] = [];
  try {
    const cached = await app.redis.get("old_customer:calendar_months");
    if (cached) calendarMonths = JSON.parse(cached);
  } catch {
    // non-critical
  }

  return { items, total: items.length, calendarMonths };
}

// ===================================================================
// SUMMARY — Thống kê tổng quát
// ===================================================================

export async function getOldCustomerSummary(
  app: FastifyInstance,
): Promise<OldCustomerSummary> {
  const [totalCustomers, employeeGroups, agentGroups, sourceGroups] =
    await Promise.all([
      app.prisma.oldCustomer.count(),
      app.prisma.oldCustomer.groupBy({
        by: ["employeeName"],
        _count: { _all: true },
        orderBy: { _count: { employeeName: "desc" } },
      }),
      app.prisma.oldCustomer.groupBy({
        by: ["agentCode"],
        _count: { _all: true },
        orderBy: { _count: { agentCode: "desc" } },
      }),
      app.prisma.oldCustomer.groupBy({
        by: ["source"],
        _count: { _all: true },
        orderBy: { _count: { source: "desc" } },
      }),
    ]);

  let calendarMonths: CalendarMonth[] = [];
  try {
    const cached = await app.redis.get("old_customer:calendar_months");
    if (cached) calendarMonths = JSON.parse(cached);
  } catch {
    // non-critical
  }

  return {
    totalCustomers,
    employees: employeeGroups.map((g) => ({
      name: g.employeeName,
      count: g._count._all,
    })),
    agents: agentGroups
      .filter((g) => g.agentCode)
      .map((g) => ({
        code: g.agentCode!,
        count: g._count._all,
      })),
    sources: sourceGroups
      .filter((g) => g.source)
      .map((g) => ({
        name: g.source!,
        count: g._count._all,
      })),
    calendarMonths,
  };
}
