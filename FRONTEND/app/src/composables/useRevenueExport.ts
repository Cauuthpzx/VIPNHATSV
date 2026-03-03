import ExcelJS from "exceljs";
import type {
  RevenueExportData,
  RevenueSummaryResult,
  RevenueMatrixResult,
  EmployeeDetailResult,
} from "@/api/services/analytics";
import { i18n } from "@/i18n";

function t(key: string, params?: Record<string, string | number>): string {
  return i18n.global.t(key, params || {});
}

// ===================================================================
// Styling — Pre-built objects, tạo 1 lần dùng cho toàn bộ workbook
// (QUY TẮC 3 optimize_service: THỐNG NHẤT STYLES — DÙNG CHUNG FORMAT)
// ===================================================================

const HEADER_FONT: Partial<ExcelJS.Font> = {
  name: "Arial",
  size: 11,
  bold: true,
  color: { argb: "FF333333" },
};

const DATA_FONT: Partial<ExcelJS.Font> = {
  name: "Arial",
  size: 10,
  color: { argb: "FF333333" },
};

const TITLE_FONT: Partial<ExcelJS.Font> = {
  name: "Arial",
  size: 13,
  bold: true,
  color: { argb: "FF000000" },
};

const SUMMARY_FONT: Partial<ExcelJS.Font> = {
  name: "Arial",
  size: 10,
  bold: true,
  color: { argb: "FF333333" },
};

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF2F2F2" },
};

const SUMMARY_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFFFFF0" },
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFD0D0D0" } },
  left: { style: "thin", color: { argb: "FFD0D0D0" } },
  bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
  right: { style: "thin", color: { argb: "FFD0D0D0" } },
};

const ALIGN_CENTER: Partial<ExcelJS.Alignment> = { vertical: "middle", horizontal: "center", wrapText: true };
const ALIGN_LEFT: Partial<ExcelJS.Alignment> = { vertical: "middle", horizontal: "left" };
const ALIGN_RIGHT: Partial<ExcelJS.Alignment> = { vertical: "middle", horizontal: "right" };

const NUM_FMT = "#,##0.##";

// ===================================================================
// Style helpers — dùng { includeEmpty: true } để style TẤT CẢ ô
// (kể cả ô null), tránh bị mờ/thiếu border
// ===================================================================

function applyHeaderStyle(row: ExcelJS.Row) {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = HEADER_FONT;
    cell.fill = HEADER_FILL;
    cell.border = THIN_BORDER;
    cell.alignment = ALIGN_CENTER;
  });
  row.height = 36;
}

function applyDataStyle(row: ExcelJS.Row, numCols: number[] = []) {
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.font = DATA_FONT;
    cell.border = THIN_BORDER;
    cell.alignment = numCols.includes(colNumber) ? ALIGN_RIGHT : ALIGN_LEFT;
    if (numCols.includes(colNumber) && typeof cell.value === "number") {
      cell.numFmt = NUM_FMT;
    }
  });
  row.height = 22;
}

function applySummaryStyle(row: ExcelJS.Row, numCols: number[] = []) {
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.font = SUMMARY_FONT;
    cell.fill = SUMMARY_FILL;
    cell.border = THIN_BORDER;
    cell.alignment = numCols.includes(colNumber) ? ALIGN_RIGHT : ALIGN_CENTER;
    if (numCols.includes(colNumber) && typeof cell.value === "number") {
      cell.numFmt = NUM_FMT;
    }
  });
  row.height = 26;
}

function formatMonth(month: string): string {
  const [y, m] = month.split("-");
  return t("excelExport.monthLabel", { month: parseInt(m), year: y });
}

function safeSheetName(name: string): string {
  return name.replace(/[\\/*?:\[\]]/g, "").substring(0, 31);
}

/**
 * Tạo array đủ totalCols phần tử, pad null ở cuối.
 * Giúp addRow tạo cell cho TẤT CẢ cột → eachCell({ includeEmpty }) sẽ iterate hết.
 */
function padRow(values: (string | number | null | undefined)[], totalCols: number): (string | number | null)[] {
  const result: (string | number | null)[] = [];
  for (let i = 0; i < totalCols; i++) {
    const v = i < values.length ? values[i] : null;
    result.push(v ?? null);
  }
  return result;
}

// ===================================================================
// Main export function
// ===================================================================

export async function exportRevenueXlsx(
  data: RevenueExportData,
  month: string,
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MAXHUB";
  workbook.created = new Date();

  buildSummarySheet(workbook, data.summary);
  buildRevenueMatrixSheet(workbook, data.summary, data.matrix);

  for (const detail of data.details) {
    buildEmployeeDetailSheet(workbook, detail);
  }

  // Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const ts = new Date().toISOString().replace(/[-:T]/g, "").substring(0, 14);
  a.download = t("excelExport.fileName", { timestamp: ts });
  a.click();
  URL.revokeObjectURL(url);
}

// ===================================================================
// Sheet 1: TỔNG QUÁT
// ===================================================================

function buildSummarySheet(
  workbook: ExcelJS.Workbook,
  summary: RevenueSummaryResult,
) {
  const ws = workbook.addWorksheet(t("excelExport.sheetSummary"));

  const headers = [
    t("excelExport.headerNo"),
    t("excelExport.headerEmployee"),
    t("excelExport.headerLotteryProfit"),
    t("excelExport.headerThirdProfit"),
    t("excelExport.headerPromotion"),
    t("excelExport.headerRebate"),
    t("excelExport.headerTotalRevenue"),
  ];

  const headerRow = ws.addRow(headers);
  applyHeaderStyle(headerRow);

  // Data rows
  const numCols = [3, 4, 5, 6, 7];
  summary.employees.forEach((emp, idx) => {
    const row = ws.addRow([
      idx + 1,
      emp.employeeName,
      emp.lotteryWinLose,
      emp.thirdGameWinLose,
      emp.promotion,
      emp.thirdRebate,
      emp.totalRevenue,
    ]);
    applyDataStyle(row, numCols);
  });

  // Grand total row
  const totalRow = ws.addRow([
    t("excelExport.grandTotal"),
    t("excelExport.grandTotal"),
    summary.grandTotal.lotteryWinLose,
    summary.grandTotal.thirdGameWinLose,
    summary.grandTotal.promotion,
    summary.grandTotal.thirdRebate,
    summary.grandTotal.totalRevenue,
  ]);
  applySummaryStyle(totalRow, numCols);

  // Column widths
  const widths = [8, 22, 18, 22, 16, 16, 22];
  for (let i = 0; i < widths.length; i++) {
    ws.getColumn(i + 1).width = widths[i];
  }

  // Freeze header
  ws.views = [{ state: "frozen", ySplit: 1 }];
}

// ===================================================================
// Sheet 2: CHI TIẾT DOANH THU (revenue matrix)
// ===================================================================

function buildRevenueMatrixSheet(
  workbook: ExcelJS.Workbook,
  summary: RevenueSummaryResult,
  matrix: RevenueMatrixResult,
) {
  const ws = workbook.addWorksheet(t("excelExport.sheetDetail"));

  const empIds = summary.employees.map((e) => e.employeeId);
  const empNames = summary.employees.map((e) => e.employeeName);
  const totalCols = empNames.length + 2;

  // Title row (merged)
  const titleText = t("excelExport.detailTitle");
  const titleValues = padRow([titleText], totalCols);
  const titleRow = ws.addRow(titleValues);
  titleRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = TITLE_FONT;
    cell.alignment = ALIGN_CENTER;
    cell.fill = HEADER_FILL;
    cell.border = THIN_BORDER;
  });
  titleRow.height = 36;
  ws.mergeCells(1, 1, 1, totalCols);

  // Employee name header row
  const headerRow = ws.addRow([t("excelExport.headerDeveloper"), ...empNames, t("excelExport.headerTotal")]);
  applyHeaderStyle(headerRow);

  // Numeric columns: 2 to totalCols
  const numCols = Array.from({ length: totalCols - 1 }, (_, i) => i + 2);

  // Data rows — one per month
  for (const monthRow of matrix.months) {
    const monthLabel = formatMonth(monthRow.month);
    const empValues = empIds.map((id) => monthRow.byEmployee[id] ?? 0);
    const displayValues = empValues.map((v) => (v === 0 ? null : v));
    const rowTotal = monthRow.rowTotal === 0 ? null : monthRow.rowTotal;

    // padRow để tạo cell cho TẤT CẢ cột → eachCell({ includeEmpty }) style hết
    const dataRow = ws.addRow(padRow([monthLabel, ...displayValues, rowTotal], totalCols));
    applyDataStyle(dataRow, numCols);
  }

  // Grand total row
  const grandValues = empIds.map((id) => matrix.grandTotalByEmployee[id] ?? 0);
  const totalRow = ws.addRow([
    t("excelExport.profitLabel"),
    ...grandValues,
    matrix.grandTotal,
  ]);
  applySummaryStyle(totalRow, numCols);

  // Column widths
  ws.getColumn(1).width = 22;
  for (let i = 2; i <= totalCols; i++) {
    ws.getColumn(i).width = 18;
  }

  ws.views = [{ state: "frozen", xSplit: 1, ySplit: 2 }];
}

// ===================================================================
// Sheet 3+: Per-employee detail
// ===================================================================

const DETAIL_COLS = 11;
const DETAIL_NUM_COLS = [5, 6, 7, 8, 9, 10, 11];

function buildEmployeeDetailSheet(
  workbook: ExcelJS.Workbook,
  detail: EmployeeDetailResult,
) {
  const sheetName = safeSheetName(detail.employeeName);

  let finalName = sheetName;
  let suffix = 2;
  while (workbook.getWorksheet(finalName)) {
    finalName = `${sheetName.substring(0, 28)}_${suffix}`;
    suffix++;
  }

  const ws = workbook.addWorksheet(finalName);

  const headers = [
    t("excelExport.headerDate"),
    t("excelExport.headerTotalCustomers"),
    t("excelExport.headerDailyCustomers"),
    t("excelExport.headerCustomerAccount"),
    t("excelExport.headerFirstDeposit"),
    t("excelExport.headerDetailLottery"),
    t("excelExport.headerDetailThird"),
    t("excelExport.headerDetailPromotion"),
    t("excelExport.headerDetailRebate"),
    t("excelExport.headerDetailTotal"),
    t("excelExport.headerWinLose"),
  ];

  const headerRow = ws.addRow(headers);
  applyHeaderStyle(headerRow);

  // Group customers by assignedDate
  const dateGroups = new Map<string, typeof detail.customers>();
  const noDateCustomers: typeof detail.customers = [];

  for (const c of detail.customers) {
    if (!c.assignedDate) {
      noDateCustomers.push(c);
    } else {
      if (!dateGroups.has(c.assignedDate)) dateGroups.set(c.assignedDate, []);
      dateGroups.get(c.assignedDate)!.push(c);
    }
  }

  const sortedDates = [...dateGroups.keys()].sort();

  // Group dates by month
  const monthGroups = new Map<string, string[]>();
  for (const date of sortedDates) {
    const monthKey = date.substring(0, 7);
    if (!monthGroups.has(monthKey)) monthGroups.set(monthKey, []);
    monthGroups.get(monthKey)!.push(date);
  }
  const sortedMonthKeys = [...monthGroups.keys()].sort();

  let runningTotal = 0;

  for (const monthKey of sortedMonthKeys) {
    const datesInMonth = monthGroups.get(monthKey)!;

    for (const date of datesInMonth) {
      const group = dateGroups.get(date)!;
      runningTotal += group.length;

      for (let i = 0; i < group.length; i++) {
        const c = group[i];
        const total = c.lotteryWinLose + c.thirdGameWinLose + c.promotion + c.thirdRebate;
        // padRow → cell cho tất cả 11 cột → style hết kể cả null
        const row = ws.addRow(padRow([
          i === 0 ? formatDateVN(date) : null,
          i === 0 ? runningTotal : null,
          i === 0 ? group.length : null,
          c.customerUsername,
          0,
          c.lotteryWinLose,
          c.thirdGameWinLose,
          c.promotion,
          c.thirdRebate,
          total,
          null,
        ], DETAIL_COLS));
        applyDataStyle(row, DETAIL_NUM_COLS);
      }
    }

    // Monthly summary row
    const [y, m] = monthKey.split("-");
    const summaryLabel = ` ${t("excelExport.monthlyProfit", { month: parseInt(m, 10).toString().padStart(2, "0"), year: y })}`;
    const summaryRow = ws.addRow(padRow([summaryLabel], DETAIL_COLS));
    applySummaryStyle(summaryRow, []);
  }

  // Customers without assigned date
  if (noDateCustomers.length > 0) {
    runningTotal += noDateCustomers.length;
    for (let i = 0; i < noDateCustomers.length; i++) {
      const c = noDateCustomers[i];
      const total = c.lotteryWinLose + c.thirdGameWinLose + c.promotion + c.thirdRebate;
      const row = ws.addRow(padRow([
        null,
        i === 0 ? runningTotal : null,
        i === 0 ? noDateCustomers.length : null,
        c.customerUsername,
        0,
        c.lotteryWinLose,
        c.thirdGameWinLose,
        c.promotion,
        c.thirdRebate,
        total,
        null,
      ], DETAIL_COLS));
      applyDataStyle(row, DETAIL_NUM_COLS);
    }
  }

  // Grand total row
  const grandTotalRow = ws.addRow(padRow([t("excelExport.grandTotalLabel")], DETAIL_COLS));
  applySummaryStyle(grandTotalRow, []);

  // Column widths
  const widths = [14, 12, 12, 22, 14, 16, 18, 14, 18, 16, 14];
  for (let i = 0; i < widths.length; i++) {
    ws.getColumn(i + 1).width = widths[i];
  }

  ws.views = [{ state: "frozen", ySplit: 1 }];
}

// ===================================================================
// Helpers
// ===================================================================

function formatDateVN(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}
