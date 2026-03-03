import ExcelJS from "exceljs";
import { layer } from "@layui/layui-vue";
import { i18n } from "@/i18n";
import {
  fetchRevenueExportData,
  type RevenueExportData,
  type EmployeeDetailResult,
  type CustomerDetail,
} from "@/api/services/analytics";

// ═══════════════ STYLES ═══════════════

const THIN: Partial<ExcelJS.Border> = { style: "thin" };
const BORDER: Partial<ExcelJS.Borders> = { top: THIN, bottom: THIN, left: THIN, right: THIN };
const FONT = { name: "Times New Roman", size: 10 };
const NUM = "#,##0";

function s(
  font: Partial<ExcelJS.Font>,
  fill?: string,
  hAlign: "center" | "left" | "right" = "center",
): {
  font: Partial<ExcelJS.Font>;
  fill?: ExcelJS.Fill;
  alignment: Partial<ExcelJS.Alignment>;
  border: Partial<ExcelJS.Borders>;
} {
  const r: ReturnType<typeof s> = {
    font: { ...FONT, ...font },
    alignment: { horizontal: hAlign, vertical: "middle", wrapText: true },
    border: BORDER,
  };
  if (fill) r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
  return r;
}

const ST = {
  tqH: s({ bold: true, color: { argb: "FFFFFFFF" } }, "FF2E7D32"),
  tqD: s({ size: 11, bold: true }, "FFFFD700"),
  tqT: s({ size: 14, bold: true, color: { argb: "FFFFFFFF" } }, "FFFF0000"),
  ctTitle: s({ size: 16, bold: true, color: { argb: "FFFFFFFF" } }, "FF1F4E79"),
  ctH: s({ size: 11, bold: true, color: { argb: "FFFFFFFF" } }, "FF4472C4"),
  ctM: s({ bold: true }, "FFD9E2F3"),
  ctT: s({ size: 12, bold: true, color: { argb: "FFFFFFFF" } }, "FFC00000"),
  eH: s({ bold: true, color: { argb: "FFFFFFFF" } }, "FF4472C4"),
  eD: s({}),
  eM: s({ size: 14, bold: true }, "FFFFFF00"),
  eT: s({ size: 14, bold: true, color: { argb: "FFFFFFFF" } }, "FFFF0000"),
};

function applyRow(row: ExcelJS.Row, style: typeof ST.tqH, cols: number, numFmt?: string) {
  for (let c = 1; c <= cols; c++) {
    const cell = row.getCell(c);
    cell.font = style.font as ExcelJS.Font;
    if (style.fill) cell.fill = style.fill as ExcelJS.Fill;
    cell.alignment = style.alignment as Partial<ExcelJS.Alignment>;
    cell.border = style.border as Partial<ExcelJS.Borders>;
    if (numFmt && c >= 3) cell.numFmt = numFmt;
  }
}

// ═══════════════ TỔNG QUÁT ═══════════════

function buildTongQuat(wb: ExcelJS.Workbook, data: RevenueExportData) {
  const ws = wb.addWorksheet("TỔNG QUÁT");
  ws.columns = [
    { width: 8 },
    { width: 22 },
    { width: 18 },
    { width: 20 },
    { width: 14 },
    { width: 18 },
    { width: 20 },
  ];

  const h = ws.addRow([
    "序号\nSTT",
    "员工姓名\nTên nhân viên",
    "彩票利润\nLợi nhuận XS",
    "第三者利润\nLợi nhuận bên thứ 3",
    "优惠\nƯu đãi",
    "第三者退款\nHoàn trả",
    "总营收\nTổng doanh thu",
  ]);
  h.height = 40;
  applyRow(h, ST.tqH, 7);

  const sorted = [...data.summary.employees].sort((a, b) => a.totalRevenue - b.totalRevenue);
  for (let i = 0; i < sorted.length; i++) {
    const e = sorted[i];
    const r = ws.addRow([
      i + 1,
      e.employeeName,
      e.lotteryWinLose,
      e.thirdGameWinLose,
      e.promotion,
      e.thirdRebate,
      e.totalRevenue,
    ]);
    applyRow(r, ST.tqD, 7, NUM);
  }

  const gt = data.summary.grandTotal;
  const tr = ws.addRow([
    "总计\nTỔNG CỘNG",
    null,
    gt.lotteryWinLose,
    gt.thirdGameWinLose,
    gt.promotion,
    gt.thirdRebate,
    gt.totalRevenue,
  ]);
  ws.mergeCells(tr.number, 1, tr.number, 2);
  applyRow(tr, ST.tqT, 7, NUM);
}

// ═══════════════ CHI TIẾT DOANH THU ═══════════════

function buildChiTiet(wb: ExcelJS.Workbook, data: RevenueExportData) {
  const ws = wb.addWorksheet("CHI TIẾT DOANH THU");
  const sorted = [...data.summary.employees].sort((a, b) => a.totalRevenue - b.totalRevenue);
  const tc = sorted.length + 2;

  ws.columns = [{ width: 16 }, ...sorted.map(() => ({ width: 15 })), { width: 18 }];

  const t1 = ws.addRow(["各月利润明细\nLỢI NHUẬN CHI TIẾT THEO THÁNG"]);
  ws.mergeCells(1, 1, 1, tc);
  t1.height = 35;
  applyRow(t1, ST.ctTitle, tc);

  const hv: string[] = ["开发人\nNHÂN VIÊN", ...sorted.map((e) => e.employeeName), "总营收\nTỔNG"];
  const h = ws.addRow(hv);
  h.height = 30;
  applyRow(h, ST.ctH, tc);

  for (const mr of data.matrix.months) {
    const vals: (string | number | null)[] = [fmtMonthLabel(mr.month)];
    for (const e of sorted) vals.push(mr.byEmployee[e.employeeId] || null);
    vals.push(mr.rowTotal || null);
    const r = ws.addRow(vals);
    r.getCell(1).style = {
      ...ST.ctM,
      font: ST.ctM.font as ExcelJS.Font,
      fill: ST.ctM.fill as ExcelJS.Fill,
      alignment: ST.ctM.alignment as Partial<ExcelJS.Alignment>,
      border: BORDER,
    };
    for (let c = 2; c <= tc; c++) {
      r.getCell(c).numFmt = NUM;
      r.getCell(c).border = BORDER;
    }
  }

  const tv: (string | number)[] = ["利润\nLỢI NHUẬN"];
  let grand = 0;
  for (const e of sorted) {
    const v = data.matrix.grandTotalByEmployee[e.employeeId] ?? 0;
    tv.push(v);
    grand += v;
  }
  tv.push(grand);
  const tr = ws.addRow(tv);
  applyRow(tr, ST.ctT, tc, NUM);
}

// ═══════════════ EMPLOYEE SHEETS ═══════════════

function buildEmployeeSheet(wb: ExcelJS.Workbook, detail: EmployeeDetailResult) {
  const ws = wb.addWorksheet(detail.employeeName);
  ws.columns = [
    { width: 14 },
    { width: 18 },
    { width: 22 },
    { width: 24 },
    { width: 16 },
    { width: 18 },
    { width: 20 },
    { width: 14 },
    { width: 20 },
    { width: 14 },
    { width: 18 },
  ];

  const h = ws.addRow([
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
  ]);
  h.height = 40;
  applyRow(h, ST.eH, 11);

  const byMonth = groupByMonth(detail.customers);
  let running = 0;
  const sumRows: number[] = [];

  for (const [mkey, custs] of byMonth) {
    const mStart = ws.rowCount + 1;
    const byDate = groupByDate(custs);

    for (const [dateStr, dayCusts] of byDate) {
      const dayStart = ws.rowCount + 1;
      for (let i = 0; i < dayCusts.length; i++) {
        running++;
        const c = dayCusts[i];
        const total = c.lotteryWinLose + c.thirdGameWinLose + c.promotion + c.thirdRebate;
        const vals: (string | number | null)[] =
          i === 0 ? [fmtDateVN(dateStr), running, dayCusts.length] : [null, null, null];
        vals.push(
          c.customerUsername,
          0,
          c.lotteryWinLose,
          c.thirdGameWinLose,
          c.promotion,
          c.thirdRebate,
          total,
          null,
        );
        const r = ws.addRow(vals);
        applyRow(r, ST.eD, 11);
        for (let col = 5; col <= 10; col++) r.getCell(col).numFmt = NUM;
      }
      if (dayCusts.length > 1) {
        for (const col of [1, 2, 3]) ws.mergeCells(dayStart, col, ws.rowCount, col);
      }
    }

    const mEnd = ws.rowCount;
    const sr = ws.addRow([`💰 LỢI NHUẬN THÁNG ${mkey.replace(/^(\d{4})-(\d{2})$/, "$2/$1")}`]);
    ws.mergeCells(sr.number, 1, sr.number, 5);
    applyRow(sr, ST.eM, 11);
    for (const ci of [6, 7, 8, 9, 10]) {
      const cl = String.fromCharCode(64 + ci);
      const cell = sr.getCell(ci);
      cell.value = { formula: `SUM(${cl}${mStart}:${cl}${mEnd})` } as ExcelJS.CellFormulaValue;
      cell.numFmt = NUM;
      cell.font = ST.eM.font as ExcelJS.Font;
      if (ST.eM.fill) cell.fill = ST.eM.fill as ExcelJS.Fill;
    }
    sumRows.push(sr.number);
  }

  const gr = ws.addRow(["TỔNG CỘNG"]);
  ws.mergeCells(gr.number, 1, gr.number, 5);
  applyRow(gr, ST.eT, 11);
  if (sumRows.length > 0) {
    for (const ci of [6, 7, 8, 9, 10]) {
      const cl = String.fromCharCode(64 + ci);
      const cell = gr.getCell(ci);
      cell.value = {
        formula: `SUM(${sumRows.map((r) => `${cl}${r}`).join(",")})`,
      } as ExcelJS.CellFormulaValue;
      cell.numFmt = NUM;
      cell.font = ST.eT.font as ExcelJS.Font;
      if (ST.eT.fill) cell.fill = ST.eT.fill as ExcelJS.Fill;
    }
  }
}

// ═══════════════ HELPERS ═══════════════

function fmtMonthLabel(m: string) {
  if (!m.includes("-")) return m;
  const [y, mo] = m.split("-");
  return `THÁNG ${parseInt(mo)}/${y}`;
}

function fmtDateVN(d: string | null) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function groupByMonth(custs: CustomerDetail[]) {
  const m = new Map<string, CustomerDetail[]>();
  for (const c of custs) {
    const k = c.assignedDate ? c.assignedDate.substring(0, 7) : "unknown";
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(c);
  }
  return new Map([...m.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

function groupByDate(custs: CustomerDetail[]) {
  const m = new Map<string, CustomerDetail[]>();
  for (const c of custs) {
    const k = c.assignedDate || "unknown";
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(c);
  }
  return m;
}

// ═══════════════ MAIN EXPORT ═══════════════

export async function exportRevenueExcel(month: string) {
  const t = i18n.global.t;
  const lid = layer.load(0, { shade: true });

  try {
    const res = await fetchRevenueExportData(month);
    const data: RevenueExportData = res.data.data;

    if (!data.summary.hasCustomerData || data.summary.employees.length === 0) {
      layer.msg(t("analyticsRevenue.noCustomerData"), { icon: 0 });
      return;
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = "MAXHUB";
    buildTongQuat(wb, data);
    buildChiTiet(wb, data);

    const sortedDetails = [...data.details].sort((a, b) => {
      const at =
        a.monthlyTotal.lotteryWinLose +
        a.monthlyTotal.thirdGameWinLose +
        a.monthlyTotal.promotion +
        a.monthlyTotal.thirdRebate;
      const bt =
        b.monthlyTotal.lotteryWinLose +
        b.monthlyTotal.thirdGameWinLose +
        b.monthlyTotal.promotion +
        b.monthlyTotal.thirdRebate;
      return at - bt;
    });
    for (const d of sortedDetails) {
      if (d.customers.length > 0) buildEmployeeSheet(wb, d);
    }

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const [y, m] = month.split("-");
    a.download = `DOANH_THU_THANG_${m}_${y}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);

    layer.msg(t("oldCustomers.exportSuccess") || "Xuất file thành công!", { icon: 1, time: 2000 });
  } catch (e) {
    console.error("Export revenue error:", e);
    layer.msg(t("oldCustomers.exportError") || "Lỗi xuất file", { icon: 2, time: 2000 });
  } finally {
    layer.close(lid);
  }
}
