import ExcelJS from "exceljs";
import type {
  RevenueExportData,
  RevenueSummaryResult,
  RevenueMatrixResult,
  EmployeeDetailResult,
} from "@/api/services/analytics";

// ===================================================================
// Styling constants
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

function applyHeaderStyle(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = HEADER_FONT;
    cell.fill = HEADER_FILL;
    cell.border = THIN_BORDER;
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });
  row.height = 36;
}

function applyDataStyle(row: ExcelJS.Row, numCols: number[] = []) {
  row.eachCell((cell, colNumber) => {
    cell.font = DATA_FONT;
    cell.border = THIN_BORDER;
    cell.alignment = {
      vertical: "middle",
      horizontal: numCols.includes(colNumber) ? "right" : "left",
    };
    if (numCols.includes(colNumber) && typeof cell.value === "number") {
      cell.numFmt = "#,##0.##";
    }
  });
  row.height = 22;
}

function applySummaryStyle(row: ExcelJS.Row, numCols: number[] = []) {
  row.eachCell((cell, colNumber) => {
    cell.font = { ...HEADER_FONT, size: 10 };
    cell.fill = SUMMARY_FILL;
    cell.border = THIN_BORDER;
    cell.alignment = {
      vertical: "middle",
      horizontal: numCols.includes(colNumber) ? "right" : "center",
    };
    if (numCols.includes(colNumber) && typeof cell.value === "number") {
      cell.numFmt = "#,##0.##";
    }
  });
  row.height = 26;
}

function formatMonth(month: string): string {
  const [y, m] = month.split("-");
  return `THÁNG ${parseInt(m)}/${y}`;
}

function safeSheetName(name: string): string {
  // Excel sheet name max 31 chars, no special chars: \ / * ? : [ ]
  return name.replace(/[\\/*?:\[\]]/g, "").substring(0, 31);
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
  a.download = `DoanhThu_${ts}.xlsx`;
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
  const ws = workbook.addWorksheet("TỔNG QUÁT");

  // Bilingual headers matching the sample file
  const headers = [
    "序号\nSTT",
    "员工姓名\nTên nhân viên",
    "彩票利润\nLợi nhuận XS",
    "第三者利润\nLợi nhuận bên thứ 3",
    "优惠\nƯu đãi",
    "第三者退款\nHoàn trả",
    "总营收\nTổng doanh thu",
  ];

  const headerRow = ws.addRow(headers);
  applyHeaderStyle(headerRow);

  // Data rows
  const numCols = [3, 4, 5, 6, 7]; // columns C-G are numeric
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
    "总计\nTỔNG CỘNG",
    "总计\nTỔNG CỘNG",
    summary.grandTotal.lotteryWinLose,
    summary.grandTotal.thirdGameWinLose,
    summary.grandTotal.promotion,
    summary.grandTotal.thirdRebate,
    summary.grandTotal.totalRevenue,
  ]);
  applySummaryStyle(totalRow, numCols);

  // Column widths
  ws.getColumn(1).width = 8;
  ws.getColumn(2).width = 22;
  ws.getColumn(3).width = 18;
  ws.getColumn(4).width = 22;
  ws.getColumn(5).width = 16;
  ws.getColumn(6).width = 16;
  ws.getColumn(7).width = 22;

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
  const ws = workbook.addWorksheet("CHI TIẾT DOANH THU");

  const empIds = summary.employees.map((e) => e.employeeId);
  const empNames = summary.employees.map((e) => e.employeeName);
  // Total columns: col 1 = month label, cols 2..N+1 = employees, col N+2 = row total
  const totalCols = empNames.length + 2;

  // Title row (merged)
  const titleText = "各月利润明细\nLỢI NHUẬN CHI TIẾT THEO THÁNG";
  const titleValues = Array(totalCols).fill(titleText);
  const titleRow = ws.addRow(titleValues);
  titleRow.eachCell((cell) => {
    cell.font = TITLE_FONT;
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.fill = HEADER_FILL;
    cell.border = THIN_BORDER;
  });
  titleRow.height = 36;
  ws.mergeCells(1, 1, 1, totalCols);

  // Employee name header row + "总营收\nTỔNG" column
  const headerRow = ws.addRow(["开发人\nNHÂN VIÊN", ...empNames, "总营收\nTỔNG"]);
  applyHeaderStyle(headerRow);

  // Numeric columns: 2 to totalCols (employees + row total)
  const numCols = Array.from({ length: totalCols - 1 }, (_, i) => i + 2);

  // Data rows — one per month
  for (const monthRow of matrix.months) {
    const monthLabel = formatMonth(monthRow.month);
    const empValues = empIds.map((id) => monthRow.byEmployee[id] ?? 0);
    // Only show non-zero values, replace 0 with null for cleaner display
    const displayValues = empValues.map((v) => (v === 0 ? null : v));
    const rowTotal = monthRow.rowTotal === 0 ? null : monthRow.rowTotal;

    const dataRow = ws.addRow([monthLabel, ...displayValues, rowTotal]);
    applyDataStyle(dataRow, numCols);
  }

  // Grand total row — "利润\nLỢI NHUẬN"
  const grandValues = empIds.map((id) => matrix.grandTotalByEmployee[id] ?? 0);
  const totalRow = ws.addRow([
    "利润\nLỢI NHUẬN",
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

function buildEmployeeDetailSheet(
  workbook: ExcelJS.Workbook,
  detail: EmployeeDetailResult,
) {
  const sheetName = safeSheetName(detail.employeeName);

  // Ensure unique sheet name
  let finalName = sheetName;
  let suffix = 2;
  while (workbook.getWorksheet(finalName)) {
    finalName = `${sheetName.substring(0, 28)}_${suffix}`;
    suffix++;
  }

  const ws = workbook.addWorksheet(finalName);

  // Bilingual headers matching the sample
  const headers = [
    "日期\nNgày",
    "开发客户总数量\nTổng lượng khách",
    "今日开发客户数量\nLượng khách trong ngày",
    "客户账号\nTài khoản khách hàng",
    "首次充值\nNạp tiền lần đầu",
    "彩票利润\nLợi nhuận xổ số",
    "第三者利润\nLợi nhuận bên thứ 3",
    "优惠\nƯu Đãi",
    "第三者退款\nHoàn trả bên thứ 3",
    "总\nTổng",
    "输赢 2M\nTHẮNG THUA",
  ];

  const headerRow = ws.addRow(headers);
  applyHeaderStyle(headerRow);

  const numCols = [5, 6, 7, 8, 9, 10, 11]; // E-K numeric

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

  // Sort dates ascending (oldest first)
  const sortedDates = [...dateGroups.keys()].sort();

  // Group dates by month (YYYY-MM) to insert monthly summary rows
  const monthGroups = new Map<string, string[]>(); // "YYYY-MM" → [date1, date2, ...]
  for (const date of sortedDates) {
    const monthKey = date.substring(0, 7); // "YYYY-MM"
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
        const row = ws.addRow([
          i === 0 ? formatDateVN(date) : null, // Date only on first row of group
          i === 0 ? runningTotal : null,
          i === 0 ? group.length : null,
          c.customerUsername,
          0, // firstDeposit — not available
          c.lotteryWinLose,
          c.thirdGameWinLose,
          c.promotion,
          c.thirdRebate,
          total,
          "",
        ]);
        applyDataStyle(row, numCols);
      }
    }

    // Monthly summary row after each month
    const [y, m] = monthKey.split("-");
    const summaryLabel = ` LỢI NHUẬN THÁNG ${parseInt(m, 10).toString().padStart(2, "0")}/${y}`;
    const summaryRow = ws.addRow([summaryLabel]);
    applySummaryStyle(summaryRow, []);
  }

  // Customers without assigned date (at the end)
  if (noDateCustomers.length > 0) {
    runningTotal += noDateCustomers.length;
    for (let i = 0; i < noDateCustomers.length; i++) {
      const c = noDateCustomers[i];
      const total = c.lotteryWinLose + c.thirdGameWinLose + c.promotion + c.thirdRebate;
      const row = ws.addRow([
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
        "",
      ]);
      applyDataStyle(row, numCols);
    }
  }

  // Grand total row at the very end
  const grandTotalRow = ws.addRow(["TỔNG CỘNG"]);
  applySummaryStyle(grandTotalRow, []);

  // Column widths
  ws.getColumn(1).width = 14;
  ws.getColumn(2).width = 12;
  ws.getColumn(3).width = 12;
  ws.getColumn(4).width = 22;
  ws.getColumn(5).width = 14;
  ws.getColumn(6).width = 16;
  ws.getColumn(7).width = 18;
  ws.getColumn(8).width = 14;
  ws.getColumn(9).width = 18;
  ws.getColumn(10).width = 16;
  ws.getColumn(11).width = 14;

  ws.views = [{ state: "frozen", ySplit: 1 }];
}

// ===================================================================
// Helpers
// ===================================================================

function formatDateVN(dateStr: string): string {
  // Convert YYYY-MM-DD → DD/MM/YYYY
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}
