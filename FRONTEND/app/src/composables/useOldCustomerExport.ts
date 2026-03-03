import ExcelJS from "exceljs";
import { layer } from "@layui/layui-vue";
import { i18n } from "@/i18n";
import { exportOldCustomers, type OldCustomerItem, type CalendarMonth } from "@/api/services/analytics";

// ═══════════════ STYLES (theo template KHÁCH HÀNG.xlsx) ═══════════════

const THIN: Partial<ExcelJS.Border> = { style: "thin" };
const BORDER: Partial<ExcelJS.Borders> = { top: THIN, bottom: THIN, left: THIN, right: THIN };
const FONT_HDR = { name: "Times New Roman", size: 11.5 };
const FONT_DATA = { name: "Times New Roman", size: 11 };
const FONT_DAY = { name: "Times New Roman", size: 10 };
const NUM = "#,##0";

// Fixed header: theme accent1 tint 0.4 ≈ #9DC3E6 (medium blue), font dark
const FIXED_HDR_FILL = "FF9DC3E6";
// Day number row: yellow #FFFF00
const DAY_NUM_FILL = "FFFFFF00";
// Month header: sky blue #00B0F0
const MONTH_HDR_FILL = "FF00B0F0";

function applyCell(
  cell: ExcelJS.Cell,
  font: Partial<ExcelJS.Font>,
  fill?: string,
  hAlign: "center" | "left" | "right" = "center",
  border?: Partial<ExcelJS.Borders>,
) {
  cell.font = font as ExcelJS.Font;
  if (fill) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } } as ExcelJS.Fill;
  cell.alignment = { horizontal: hAlign, vertical: "middle", wrapText: true } as Partial<ExcelJS.Alignment>;
  if (border) cell.border = border as Partial<ExcelJS.Borders>;
}

// ═══════════════ HELPERS ═══════════════

function recent3Months(): { label: string; days: number }[] {
  const now = new Date();
  const r: { label: string; days: number }[] = [];
  for (let off = 2; off >= 0; off--) {
    const d = new Date(now.getFullYear(), now.getMonth() - off, 1);
    const lb = `T${d.getMonth() + 1}`;
    const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    r.push({ label: lb, days });
  }
  return r;
}

function pDate(s: string): number {
  if (!s) return 0;
  const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m1) return new Date(+m1[3], +m1[2] - 1, +m1[1]).getTime();
  const m2 = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m2) return new Date(+m2[1], +m2[2] - 1, +m2[3]).getTime();
  return 0;
}

// ═══════════════ BUILD SHEET ═══════════════

function buildOldCustomerSheet(
  wb: ExcelJS.Workbook,
  items: OldCustomerItem[],
  calendarMonths: CalendarMonth[],
) {
  const ws = wb.addWorksheet("KHÁCH HÀNG");

  const sm = recent3Months();
  // Override with server data if available
  if (calendarMonths.length >= 3) {
    for (let i = 0; i < 3; i++) {
      const cm = calendarMonths[calendarMonths.length - 3 + i];
      if (cm) {
        sm[i].label = cm.label;
        sm[i].days = cm.days;
      }
    }
  }

  // Template columns: A=Ngày, B=NV, C=Đại lý, D=Tài khoản, E=Zalo, F=Nguồn, G=TK giới thiệu, H=(empty spacer), I=Nạp đầu
  const fixedHeaders = [
    "NGÀY THÁNG\n日期",
    "TÊN NHÂN VIÊN\n员工姓名",
    "DÂY ĐẠI LÍ",
    "TÊN TÀI KHOẢN\n账户名称",
    "ZALO\n名称",
    "NGUỒN\n来源",
    "TK GIỚI THIỆU\n推荐账号",
    "", // Column H spacer (matches template)
    "NẠP ĐẦU\n首充金额",
  ];
  const fc = fixedHeaders.length; // 9 (A-I)
  let totalDayCols = 0;
  const monthInfo: { label: string; days: number; startCol: number }[] = [];
  for (const m of sm) {
    monthInfo.push({ label: m.label, days: m.days, startCol: fc + totalDayCols + 1 }); // 1-indexed
    totalDayCols += m.days;
  }
  const totalCols = fc + totalDayCols;

  // Column widths (matching template)
  const cols: Partial<ExcelJS.Column>[] = [];
  const fixedWidths = [11, 13, 13, 16.5, 26.5, 15, 13, 2, 13]; // A-I
  for (let i = 0; i < fc; i++) cols.push({ width: fixedWidths[i] } as Partial<ExcelJS.Column>);
  for (let i = 0; i < totalDayCols; i++) cols.push({ width: 5.5 } as Partial<ExcelJS.Column>);
  ws.columns = cols;

  // ──── Row 1: Fixed headers (merged 2 rows) + Month headers (merged across days) ────
  const row1 = ws.addRow([]);
  row1.height = 21;

  // Fixed headers A-I
  for (let i = 0; i < fc; i++) {
    const cell = row1.getCell(i + 1);
    cell.value = fixedHeaders[i];
    applyCell(cell, { ...FONT_HDR, bold: true }, FIXED_HDR_FILL, "center", BORDER);
  }

  // Month headers
  for (const m of monthInfo) {
    const mn = m.label.replace("T", "");
    const cell = row1.getCell(m.startCol);
    cell.value = `THÁNG ${mn}`;
    applyCell(cell, { ...FONT_HDR, bold: false, size: 12 }, MONTH_HDR_FILL, "center", BORDER);
    if (m.days > 1) {
      ws.mergeCells(1, m.startCol, 1, m.startCol + m.days - 1);
    }
    for (let d = 1; d < m.days; d++) {
      applyCell(row1.getCell(m.startCol + d), { ...FONT_HDR, size: 12 }, MONTH_HDR_FILL, "center", BORDER);
    }
  }

  // ──── Row 2: Day numbers + merge fixed headers ────
  const row2 = ws.addRow([]);
  row2.height = 21;

  for (let i = 0; i < fc; i++) {
    const cell = row2.getCell(i + 1);
    cell.value = "";
    applyCell(cell, { ...FONT_HDR, bold: true }, FIXED_HDR_FILL, "center", BORDER);
  }

  // Merge fixed header cells across 2 rows (A1:A2, B1:B2, ..., I1:I2)
  for (let i = 0; i < fc; i++) {
    ws.mergeCells(1, i + 1, 2, i + 1);
  }

  // Day numbers with yellow bg
  for (const m of monthInfo) {
    for (let d = 1; d <= m.days; d++) {
      const cell = row2.getCell(m.startCol + d - 1);
      cell.value = d;
      applyCell(cell, { ...FONT_DAY, bold: false, size: 12 }, DAY_NUM_FILL, "center", BORDER);
    }
  }

  // Sort items by date
  const sorted = [...items].sort((a, b) => pDate(a.assignedDate || "") - pDate(b.assignedDate || ""));

  // Group by date for merging column A
  const dateGroups: { start: number; end: number; date: string }[] = [];
  if (sorted.length > 0) {
    let gs = 0;
    for (let i = 1; i <= sorted.length; i++) {
      const cur = i < sorted.length ? sorted[i].assignedDate || "" : null;
      if (cur !== (sorted[gs].assignedDate || "")) {
        dateGroups.push({ start: gs, end: i - 1, date: sorted[gs].assignedDate || "" });
        gs = i;
      }
    }
  }

  // ──── Data rows ────
  for (let i = 0; i < sorted.length; i++) {
    const it = sorted[i];
    const row = ws.addRow([]);
    row.height = 16;

    // Col A: Date (merged per group)
    const g = dateGroups.find((x) => i >= x.start && i <= x.end);
    const isFirst = g ? i === g.start : true;
    const dateCell = row.getCell(1);
    if (isFirst && it.assignedDate) {
      // Convert YYYY-MM-DD to Date object for Excel date format
      const parts = it.assignedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (parts) {
        dateCell.value = new Date(+parts[1], +parts[2] - 1, +parts[3]);
        dateCell.numFmt = "DD/MM/YYYY";
      } else {
        dateCell.value = it.assignedDate;
      }
    } else if (isFirst) {
      dateCell.value = "";
    } else {
      dateCell.value = "";
    }
    applyCell(dateCell, FONT_DATA, undefined, "center", BORDER);

    // Col B: NV
    const bCell = row.getCell(2);
    bCell.value = it.employeeName || "";
    applyCell(bCell, { ...FONT_DATA, size: 10 }, undefined, "center", BORDER);

    // Col C: Đại lý
    const cCell = row.getCell(3);
    cCell.value = it.agentCode || "";
    applyCell(cCell, FONT_DATA, undefined, "center", BORDER);

    // Col D: Tài khoản
    const dCell = row.getCell(4);
    dCell.value = it.username || "";
    applyCell(dCell, FONT_DATA, undefined, "center", BORDER);

    // Col E: Liên hệ (Zalo)
    const eCell = row.getCell(5);
    eCell.value = it.contactInfo || "";
    applyCell(eCell, FONT_DATA, undefined, "center", BORDER);

    // Col F: Nguồn
    const fCell = row.getCell(6);
    fCell.value = it.source || "";
    applyCell(fCell, FONT_DATA, undefined, "center", BORDER);

    // Col G: TK giới thiệu
    const gCell = row.getCell(7);
    gCell.value = it.referralAccount || "";
    applyCell(gCell, FONT_DATA, undefined, "center", BORDER);

    // Col H: spacer (empty)
    const hCell = row.getCell(8);
    hCell.value = "";
    applyCell(hCell, FONT_DATA, undefined, "center", BORDER);

    // Col I: Nạp đầu
    const iCell = row.getCell(9);
    iCell.value = it.firstDeposit ?? 0;
    applyCell(iCell, FONT_DATA, undefined, "right", BORDER);
    iCell.numFmt = NUM;

    // Calendar day columns — 'v' for online, empty for offline (matches template)
    const onlineDays = new Set(it.onlineDays || []);
    for (const m of monthInfo) {
      for (let d = 1; d <= m.days; d++) {
        const cell = row.getCell(m.startCol + d - 1);
        const key = `${m.label}-${d}`;
        if (onlineDays.has(key)) {
          cell.value = "v";
          applyCell(cell, FONT_DAY, undefined, "center");
        } else {
          cell.value = "";
        }
      }
    }
  }

  // Merge date cells for same-date groups
  for (const g of dateGroups) {
    if (g.end > g.start) {
      ws.mergeCells(g.start + 3, 1, g.end + 3, 1); // +3 = 2 header rows + 1-indexed
    }
  }

  // Freeze panes: 9 fixed columns + 2 header rows
  ws.views = [{ state: "frozen", xSplit: fc, ySplit: 2, topLeftCell: "J3" }];
}

// ═══════════════ MAIN EXPORT ═══════════════

export async function exportOldCustomerExcel(params: {
  employee?: string;
  agentCode?: string;
  search?: string;
}) {
  const t = i18n.global.t;
  const lid = layer.load(0, { shade: true });

  try {
    const res = await exportOldCustomers(params);
    const data = res.data.data;

    if (!data.items || data.items.length === 0) {
      layer.msg(t("oldCustomers.noData"), { icon: 0 });
      return;
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = "MAXHUB";
    buildOldCustomerSheet(wb, data.items, data.calendarMonths || []);

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const now = new Date();
    a.download = `KHACH_HANG_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);

    layer.msg(t("oldCustomers.exportSuccess") || "Xuất file thành công!", { icon: 1, time: 2000 });
  } catch (e) {
    console.error("Export old customers error:", e);
    layer.msg(t("oldCustomers.exportError") || "Lỗi xuất file", { icon: 2, time: 2000 });
  } finally {
    layer.close(lid);
  }
}
