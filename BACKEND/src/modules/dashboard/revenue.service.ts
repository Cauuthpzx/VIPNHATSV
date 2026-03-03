import type { FastifyInstance } from "fastify";
import * as XLSX from "xlsx";
import { logger } from "../../utils/logger.js";

// ===================================================================
// TYPES
// ===================================================================

export interface RevenueEmployeeSummary {
  employeeId: string;
  employeeName: string;
  lotteryWinLose: number;
  thirdGameWinLose: number;
  promotion: number;
  thirdRebate: number;
  totalRevenue: number;
  customerCount: number;
}

export interface RevenueSummaryResult {
  month: string;
  employees: RevenueEmployeeSummary[];
  grandTotal: {
    lotteryWinLose: number;
    thirdGameWinLose: number;
    promotion: number;
    thirdRebate: number;
    totalRevenue: number;
    customerCount: number;
  };
  hasCustomerData: boolean;
}

export interface CustomerDetail {
  customerUsername: string;
  assignedDate: string | null;
  lotteryWinLose: number;
  thirdGameWinLose: number;
  promotion: number;
  thirdRebate: number;
  totalRevenue: number;
}

export interface EmployeeDetailResult {
  employeeId: string;
  employeeName: string;
  month: string;
  customers: CustomerDetail[];
  monthlyTotal: {
    lotteryWinLose: number;
    thirdGameWinLose: number;
    promotion: number;
    thirdRebate: number;
    totalRevenue: number;
  };
}

export interface MonthlyRevenueRow {
  month: string;
  byEmployee: Record<string, number>; // employeeId → totalRevenue
  rowTotal: number;
}

export interface RevenueMatrixResult {
  months: MonthlyRevenueRow[];
  grandTotalByEmployee: Record<string, number>;
  grandTotal: number;
}

export interface RevenueExportData {
  summary: RevenueSummaryResult;
  details: EmployeeDetailResult[];
  matrix: RevenueMatrixResult;
}

// ===================================================================
// 1. UPLOAD & PARSE EXCEL
// ===================================================================

export async function processCustomerUpload(
  app: FastifyInstance,
  fileBuffer: Buffer,
): Promise<{ employeeCount: number; mappingCount: number }> {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Skip header rows (row 0, 1)
  const dataRows = rows.slice(2);

  // Collect unique employees and mappings
  const employeeCustomers = new Map<string, Set<string>>();
  const assignedDates = new Map<string, string>();

  for (const row of dataRows) {
    if (!row || row.length < 3) continue;

    const rawDate = row[0];
    const employeeName = String(row[1] || "").trim();
    const customerUsername = String(row[2] || "").trim().toLowerCase();

    if (!employeeName || !customerUsername) continue;

    if (!employeeCustomers.has(employeeName)) {
      employeeCustomers.set(employeeName, new Set());
    }
    employeeCustomers.get(employeeName)!.add(customerUsername);

    // Parse date
    let dateStr: string | undefined;
    if (typeof rawDate === "number") {
      // Excel serial date → JS Date → YYYY-MM-DD
      // Excel epoch: 1900-01-01 = serial 1 (with the 1900 leap year bug)
      const epoch = new Date(1899, 11, 30); // Dec 30, 1899
      const d = new Date(epoch.getTime() + rawDate * 86400000);
      dateStr = d.toISOString().slice(0, 10);
    } else if (rawDate instanceof Date) {
      dateStr = rawDate.toISOString().slice(0, 10);
    } else if (typeof rawDate === "string" && rawDate.trim()) {
      const trimmed = rawDate.trim();
      // Try DD/MM/YYYY
      const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (match) {
        dateStr = `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
      } else {
        // Try parsing as Date string (e.g. "Thu May 26 2022 ...")
        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) {
          dateStr = parsed.toISOString().slice(0, 10);
        } else {
          dateStr = trimmed;
        }
      }
    }

    if (dateStr) {
      assignedDates.set(`${employeeName}|${customerUsername}`, dateStr);
    }
  }

  // Replace all: delete old data, insert new from file
  // Use transaction to ensure atomicity
  const totalMappings = await app.prisma.$transaction(async (tx) => {
    // 1. Delete ALL existing mappings and employees
    await tx.employeeCustomer.deleteMany({});
    await tx.employee.deleteMany({});

    // 2. Insert fresh from file
    for (const [name, customers] of employeeCustomers) {
      const employee = await tx.employee.create({ data: { name } });

      const createData = [...customers].map((username) => ({
        employeeId: employee.id,
        customerUsername: username,
        assignedDate: assignedDates.get(`${name}|${username}`) ?? null,
      }));

      await tx.employeeCustomer.createMany({ data: createData });
    }

    return tx.employeeCustomer.count();
  });

  logger.info("Customer upload processed", {
    employeeCount: employeeCustomers.size,
    totalMappings,
  });

  return {
    employeeCount: employeeCustomers.size,
    mappingCount: totalMappings,
  };
}

// ===================================================================
// 2. REVENUE SUMMARY
// ===================================================================

function getMonthDateRange(month: string): { startDate: string; endDate: string } {
  const [year, mon] = month.split("-").map(Number);
  const startDate = `${month}-01`;
  const lastDay = new Date(year, mon, 0).getDate();
  const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;
  return { startDate, endDate };
}

export async function getRevenueSummary(
  app: FastifyInstance,
  month: string,
): Promise<RevenueSummaryResult> {
  const { startDate, endDate } = getMonthDateRange(month);

  // Get all employees with customer count
  const employees = await app.prisma.employee.findMany({
    include: { _count: { select: { customers: true } } },
    orderBy: { name: "asc" },
  });

  if (employees.length === 0) {
    return {
      month,
      employees: [],
      grandTotal: {
        lotteryWinLose: 0,
        thirdGameWinLose: 0,
        promotion: 0,
        thirdRebate: 0,
        totalRevenue: 0,
        customerCount: 0,
      },
      hasCustomerData: false,
    };
  }

  const totalCustomers = employees.reduce((s, e) => s + e._count.customers, 0);

  if (totalCustomers === 0) {
    return {
      month,
      employees: employees.map((e) => ({
        employeeId: e.id,
        employeeName: e.name,
        lotteryWinLose: 0,
        thirdGameWinLose: 0,
        promotion: 0,
        thirdRebate: 0,
        totalRevenue: 0,
        customerCount: 0,
      })),
      grandTotal: {
        lotteryWinLose: 0,
        thirdGameWinLose: 0,
        promotion: 0,
        thirdRebate: 0,
        totalRevenue: 0,
        customerCount: 0,
      },
      hasCustomerData: true,
    };
  }

  // Use raw SQL JOINs to avoid bind variable limit (32,767 max)
  // Join employee_customers with report tables server-side
  const [lotteryData, thirdGameData, fundsData] = await Promise.all([
    app.prisma.$queryRaw<{ employee_id: string; total: number }[]>`
      SELECT ec.employee_id, COALESCE(SUM(r.win_lose), 0)::float AS total
      FROM employee_customers ec
      JOIN proxy_report_lottery r ON r.username = ec.customer_username
      WHERE r.report_date >= ${startDate} AND r.report_date <= ${endDate}
      GROUP BY ec.employee_id
    `,
    app.prisma.$queryRaw<{ employee_id: string; total: number }[]>`
      SELECT ec.employee_id, COALESCE(SUM(r.t_win_lose), 0)::float AS total
      FROM employee_customers ec
      JOIN proxy_report_third_game r ON r.username = ec.customer_username
      WHERE r.report_date >= ${startDate} AND r.report_date <= ${endDate}
      GROUP BY ec.employee_id
    `,
    app.prisma.$queryRaw<{ employee_id: string; promo: number; rebate: number }[]>`
      SELECT ec.employee_id,
             COALESCE(SUM(r.promotion), 0)::float AS promo,
             COALESCE(SUM(r.third_rebate), 0)::float AS rebate
      FROM employee_customers ec
      JOIN proxy_report_funds r ON r.username = ec.customer_username
      WHERE r.report_date >= ${startDate} AND r.report_date <= ${endDate}
      GROUP BY ec.employee_id
    `,
  ]);

  // Accumulate per employee
  const empAccum = new Map<
    string,
    { lottery: number; third: number; promo: number; rebate: number }
  >();
  for (const emp of employees) {
    empAccum.set(emp.id, { lottery: 0, third: 0, promo: 0, rebate: 0 });
  }

  for (const r of lotteryData) {
    if (empAccum.has(r.employee_id)) {
      empAccum.get(r.employee_id)!.lottery = Number(r.total);
    }
  }

  for (const r of thirdGameData) {
    if (empAccum.has(r.employee_id)) {
      empAccum.get(r.employee_id)!.third = Number(r.total);
    }
  }

  for (const r of fundsData) {
    if (empAccum.has(r.employee_id)) {
      empAccum.get(r.employee_id)!.promo = Number(r.promo);
      empAccum.get(r.employee_id)!.rebate = Number(r.rebate);
    }
  }

  // Build result — sort by totalRevenue ascending (most negative = most profit first)
  const summaries: RevenueEmployeeSummary[] = employees.map((emp) => {
    const acc = empAccum.get(emp.id)!;
    return {
      employeeId: emp.id,
      employeeName: emp.name,
      lotteryWinLose: acc.lottery,
      thirdGameWinLose: acc.third,
      promotion: acc.promo,
      thirdRebate: acc.rebate,
      totalRevenue: acc.lottery + acc.third + acc.promo + acc.rebate,
      customerCount: emp._count.customers,
    };
  });

  // Sort: most negative total first (most profitable)
  summaries.sort((a, b) => a.totalRevenue - b.totalRevenue);

  const grandTotal = summaries.reduce(
    (t, e) => ({
      lotteryWinLose: t.lotteryWinLose + e.lotteryWinLose,
      thirdGameWinLose: t.thirdGameWinLose + e.thirdGameWinLose,
      promotion: t.promotion + e.promotion,
      thirdRebate: t.thirdRebate + e.thirdRebate,
      totalRevenue: t.totalRevenue + e.totalRevenue,
      customerCount: t.customerCount + e.customerCount,
    }),
    {
      lotteryWinLose: 0,
      thirdGameWinLose: 0,
      promotion: 0,
      thirdRebate: 0,
      totalRevenue: 0,
      customerCount: 0,
    },
  );

  return { month, employees: summaries, grandTotal, hasCustomerData: true };
}

// ===================================================================
// 3. REVENUE MATRIX — all months breakdown per employee
// ===================================================================

export async function getRevenueMatrix(
  app: FastifyInstance,
): Promise<RevenueMatrixResult> {
  // Query totalRevenue per (employee_id, month) using raw SQL
  // totalRevenue = lottery + thirdGame + promotion + thirdRebate
  const rawData = await app.prisma.$queryRaw<
    { employee_id: string; month: string; total: number }[]
  >`
    SELECT
      ec.employee_id,
      TO_CHAR(r.report_date::date, 'YYYY-MM') AS month,
      SUM(r.total)::float AS total
    FROM employee_customers ec
    JOIN (
      SELECT username, report_date, win_lose AS total FROM proxy_report_lottery
      UNION ALL
      SELECT username, report_date, t_win_lose AS total FROM proxy_report_third_game
      UNION ALL
      SELECT username, report_date, promotion AS total FROM proxy_report_funds
      UNION ALL
      SELECT username, report_date, third_rebate AS total FROM proxy_report_funds
    ) r ON r.username = ec.customer_username
    GROUP BY ec.employee_id, TO_CHAR(r.report_date::date, 'YYYY-MM')
    ORDER BY month
  `;

  // Collect unique months and build per-month, per-employee map
  const monthSet = new Set<string>();
  const dataMap = new Map<string, number>(); // "month|empId" → total

  for (const row of rawData) {
    monthSet.add(row.month);
    const key = `${row.month}|${row.employee_id}`;
    dataMap.set(key, (dataMap.get(key) ?? 0) + Number(row.total));
  }

  // Get all employee IDs
  const employees = await app.prisma.employee.findMany({
    select: { id: true },
    orderBy: { name: "asc" },
  });
  const empIds = employees.map((e) => e.id);

  const sortedMonths = [...monthSet].sort();

  const months: MonthlyRevenueRow[] = sortedMonths.map((m) => {
    const byEmployee: Record<string, number> = {};
    let rowTotal = 0;
    for (const empId of empIds) {
      const val = dataMap.get(`${m}|${empId}`) ?? 0;
      byEmployee[empId] = val;
      rowTotal += val;
    }
    return { month: m, byEmployee, rowTotal };
  });

  // Grand totals per employee
  const grandTotalByEmployee: Record<string, number> = {};
  let grandTotal = 0;
  for (const empId of empIds) {
    const total = months.reduce((s, m) => s + (m.byEmployee[empId] ?? 0), 0);
    grandTotalByEmployee[empId] = total;
    grandTotal += total;
  }

  return { months, grandTotalByEmployee, grandTotal };
}

// ===================================================================
// 4. EXPORT DATA — per-employee customer detail
// ===================================================================

export async function getRevenueExportData(
  app: FastifyInstance,
  month: string,
): Promise<RevenueExportData> {
  const [summary, matrix] = await Promise.all([
    getRevenueSummary(app, month),
    getRevenueMatrix(app),
  ]);

  // Fetch all employee-customer mappings at once
  const allEmpCustomers = await app.prisma.employeeCustomer.findMany({
    select: { employeeId: true, customerUsername: true, assignedDate: true },
  });

  // Group by employeeId
  const empCustomerMap = new Map<string, { customerUsername: string; assignedDate: string | null }[]>();
  for (const ec of allEmpCustomers) {
    if (!empCustomerMap.has(ec.employeeId)) empCustomerMap.set(ec.employeeId, []);
    empCustomerMap.get(ec.employeeId)!.push({
      customerUsername: ec.customerUsername,
      assignedDate: ec.assignedDate,
    });
  }

  // Query ALL-TIME per-username aggregates (no date filter — full history for export)
  const [lotteryByUser, thirdByUser, fundsByUser] = await Promise.all([
    app.prisma.$queryRaw<{ username: string; total: number }[]>`
      SELECT ec.customer_username AS username, COALESCE(SUM(r.win_lose), 0)::float AS total
      FROM employee_customers ec
      JOIN proxy_report_lottery r ON r.username = ec.customer_username
      GROUP BY ec.customer_username
    `,
    app.prisma.$queryRaw<{ username: string; total: number }[]>`
      SELECT ec.customer_username AS username, COALESCE(SUM(r.t_win_lose), 0)::float AS total
      FROM employee_customers ec
      JOIN proxy_report_third_game r ON r.username = ec.customer_username
      GROUP BY ec.customer_username
    `,
    app.prisma.$queryRaw<{ username: string; promo: number; rebate: number }[]>`
      SELECT ec.customer_username AS username,
             COALESCE(SUM(r.promotion), 0)::float AS promo,
             COALESCE(SUM(r.third_rebate), 0)::float AS rebate
      FROM employee_customers ec
      JOIN proxy_report_funds r ON r.username = ec.customer_username
      GROUP BY ec.customer_username
    `,
  ]);

  // Build global per-username maps
  const lotteryMap = new Map(lotteryByUser.map((r) => [r.username, Number(r.total)]));
  const thirdMap = new Map(thirdByUser.map((r) => [r.username, Number(r.total)]));
  const promoMap = new Map(fundsByUser.map((r) => [r.username, Number(r.promo)]));
  const rebateMap = new Map(fundsByUser.map((r) => [r.username, Number(r.rebate)]));

  const details: EmployeeDetailResult[] = [];

  for (const empSummary of summary.employees) {
    const empCustomers = empCustomerMap.get(empSummary.employeeId) ?? [];

    if (empCustomers.length === 0) {
      details.push({
        employeeId: empSummary.employeeId,
        employeeName: empSummary.employeeName,
        month,
        customers: [],
        monthlyTotal: {
          lotteryWinLose: 0,
          thirdGameWinLose: 0,
          promotion: 0,
          thirdRebate: 0,
          totalRevenue: 0,
        },
      });
      continue;
    }

    const customers: CustomerDetail[] = empCustomers.map((ec) => {
      const lottery = lotteryMap.get(ec.customerUsername) ?? 0;
      const third = thirdMap.get(ec.customerUsername) ?? 0;
      const promo = promoMap.get(ec.customerUsername) ?? 0;
      const rebate = rebateMap.get(ec.customerUsername) ?? 0;
      return {
        customerUsername: ec.customerUsername,
        assignedDate: ec.assignedDate,
        lotteryWinLose: lottery,
        thirdGameWinLose: third,
        promotion: promo,
        thirdRebate: rebate,
        totalRevenue: lottery + third + promo + rebate,
      };
    });

    // Sort customers by assignedDate ascending (oldest first), null dates last
    customers.sort((a, b) => {
      if (!a.assignedDate && !b.assignedDate) return 0;
      if (!a.assignedDate) return 1;
      if (!b.assignedDate) return -1;
      return a.assignedDate.localeCompare(b.assignedDate);
    });

    const monthlyTotal = customers.reduce(
      (t, c) => ({
        lotteryWinLose: t.lotteryWinLose + c.lotteryWinLose,
        thirdGameWinLose: t.thirdGameWinLose + c.thirdGameWinLose,
        promotion: t.promotion + c.promotion,
        thirdRebate: t.thirdRebate + c.thirdRebate,
        totalRevenue: t.totalRevenue + c.totalRevenue,
      }),
      {
        lotteryWinLose: 0,
        thirdGameWinLose: 0,
        promotion: 0,
        thirdRebate: 0,
        totalRevenue: 0,
      },
    );

    details.push({
      employeeId: empSummary.employeeId,
      employeeName: empSummary.employeeName,
      month,
      customers,
      monthlyTotal,
    });
  }

  logger.info("Revenue export data prepared", {
    month,
    employees: details.length,
    totalCustomers: details.reduce((s, d) => s + d.customers.length, 0),
  });

  return { summary, details, matrix };
}
