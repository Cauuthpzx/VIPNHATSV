<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { layer } from "@layui/layui-vue";
import Spreadsheet from "x-data-spreadsheet";
import { useToolbarPermission } from "@/composables/useToolbarPermission";
import NoteCustomerDialog from "./NoteCustomerDialog.vue";
import {
  exportOldCustomers,
  fetchOldCustomerSummary,
  uploadOldCustomerFile,
  type OldCustomerItem,
  type OldCustomerSummary,
  type CalendarMonth,
} from "@/api/services/analytics";

const { t } = useI18n();
const { canExport } = useToolbarPermission();

const noteDialogRef = ref<InstanceType<typeof NoteCustomerDialog> | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const loading = ref(false);
const uploading = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const summary = ref<OldCustomerSummary | null>(null);
const allItems = ref<OldCustomerItem[]>([]);
const calendarMonths = ref<CalendarMonth[]>([]);
const totalCount = ref(0);

// Phân trang spreadsheet
const pageLimit = ref(100);
const currentPage = ref(1);

/** Sắp xếp theo ngày từ cũ đến mới */
const sortedItems = computed(() => {
  return [...allItems.value].sort((a, b) => {
    const da = a.assignedDate || "";
    const db = b.assignedDate || "";
    // Parse dd/mm/yyyy hoặc yyyy-mm-dd
    const pa = parseDate(da);
    const pb = parseDate(db);
    return pa - pb;
  });
});

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageLimit.value;
  return sortedItems.value.slice(start, start + pageLimit.value);
});

let spreadsheet: InstanceType<typeof Spreadsheet> | null = null;

const searchForm = reactive({
  employee: "",
  agentCode: "",
  search: "",
});

const employeeOptions = computed(() =>
  (summary.value?.employees || []).map((e) => ({
    label: `${e.name} (${e.count.toLocaleString()})`,
    value: e.name,
  })),
);

const agentOptions = computed(() =>
  (summary.value?.agents || []).map((a) => ({
    label: `${a.code} (${a.count.toLocaleString()})`,
    value: a.code,
  })),
);

/** Sắp xếp tháng: T1, T2, T3, ... T11, T12 */
function sortMonths(months: CalendarMonth[]): CalendarMonth[] {
  return [...months].sort((a, b) => {
    const na = parseInt(a.label.replace("T", ""), 10) || 0;
    const nb = parseInt(b.label.replace("T", ""), 10) || 0;
    return na - nb;
  });
}

/** Luôn tạo đủ 3 tháng gần nhất (tháng hiện tại + 2 tháng trước) */
function ensureRecent3Months(months: CalendarMonth[]): CalendarMonth[] {
  const now = new Date();
  const recent: CalendarMonth[] = [];
  for (let offset = 2; offset >= 0; offset--) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const monthNum = d.getMonth() + 1; // 1-12
    const label = `T${monthNum}`;
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    // Kiểm tra xem đã có trong data chưa
    const existing = months.find((m) => m.label === label);
    recent.push(existing || { label, days: daysInMonth });
  }
  return recent;
}

/** Convert data thành x-data-spreadsheet format */
function buildSheetData(items: OldCustomerItem[], months: CalendarMonth[]) {
  // Luôn hiển thị đủ 3 tháng gần đây
  const sorted = ensureRecent3Months(months);

  // Build header labels (bỏ cột #)
  const fixedHeaders = ["Ngày", "NV", "Đại lý", "Tài khoản", "Liên hệ", "Nguồn", "Giới thiệu", "Nạp lần đầu"];
  const fixedColCount = fixedHeaders.length;

  // Calendar header: month label rows + day rows
  // Row 0: fixed headers merged 2 rows + month labels spanning days
  // Row 1: empty for fixed cols + day numbers

  // Tính tổng cột calendar
  let totalCalCols = 0;
  const monthOffsets: { label: string; days: number; startCol: number }[] = [];
  for (const m of sorted) {
    monthOffsets.push({ label: m.label, days: m.days, startCol: fixedColCount + totalCalCols });
    totalCalCols += m.days;
  }
  const totalCols = fixedColCount + totalCalCols;

  // Styles — tất cả fixed, không dynamic
  // Mỗi style phải là object mới (không share reference)
  const mkBorder = () => ({
    top: ["thin", "#e0e0e0"], bottom: ["thin", "#e0e0e0"],
    left: ["thin", "#e0e0e0"], right: ["thin", "#e0e0e0"],
  });
  const mkBorderLight = () => ({
    top: ["thin", "#f0f0f0"], bottom: ["thin", "#f0f0f0"],
    left: ["thin", "#f0f0f0"], right: ["thin", "#f0f0f0"],
  });

  const styles: any[] = [
    // 0: header - bold, center, gray bg
    { font: { bold: true }, align: "center", valign: "middle", bgcolor: "#f2f2f2", border: mkBorder() },
    // 1: normal data left
    { font: { bold: false }, align: "left", valign: "middle", bgcolor: "#ffffff", border: mkBorderLight() },
    // 2: number right align
    { font: { bold: false }, align: "right", valign: "middle", bgcolor: "#ffffff", border: mkBorderLight() },
    // 3: calendar empty (center, white)
    { font: { bold: false }, align: "center", valign: "middle", bgcolor: "#ffffff", border: mkBorderLight() },
    // 4: date merged cell (center, light bg)
    { font: { bold: false }, align: "center", valign: "middle", bgcolor: "#fafafa", border: mkBorder() },
    // === Tháng 1 (index 0): Xanh dương ===
    // 5: month header xanh dương
    { font: { bold: true }, align: "center", valign: "middle", bgcolor: "#42a5f5", border: mkBorder() },
    // 6: day header xanh dương nhạt
    { font: { bold: true }, align: "center", valign: "middle", bgcolor: "#e3f2fd", border: mkBorder() },
    // 7: check xanh dương (chỉ font color, không bgcolor)
    { font: { bold: true, color: "#1565c0" }, align: "center", valign: "middle", bgcolor: "#ffffff", border: mkBorderLight() },
    // === Tháng 2 (index 1): Đỏ/Hồng ===
    // 8: month header đỏ
    { font: { bold: true }, align: "center", valign: "middle", bgcolor: "#ef5350", border: mkBorder() },
    // 9: day header hồng nhạt
    { font: { bold: true }, align: "center", valign: "middle", bgcolor: "#fce4ec", border: mkBorder() },
    // 10: check hồng (chỉ font color, không bgcolor)
    { font: { bold: true, color: "#c62828" }, align: "center", valign: "middle", bgcolor: "#ffffff", border: mkBorderLight() },
    // === Tháng 3 (index 2): Xanh lá ===
    // 11: month header xanh lá
    { font: { bold: true }, align: "center", valign: "middle", bgcolor: "#66bb6a", border: mkBorder() },
    // 12: day header xanh lá nhạt
    { font: { bold: true }, align: "center", valign: "middle", bgcolor: "#e8f5e9", border: mkBorder() },
    // 13: check xanh lá (chỉ font color, không bgcolor)
    { font: { bold: true, color: "#2e7d32" }, align: "center", valign: "middle", bgcolor: "#ffffff", border: mkBorderLight() },
  ];

  // Map tháng → style indices (dùng thứ tự 3 tháng gần đây)
  const monthStyleMap: Record<string, { headerIdx: number; dayIdx: number; checkIdx: number }> = {};
  sorted.forEach((mo, idx) => {
    const base = 5 + idx * 3;
    monthStyleMap[mo.label] = { headerIdx: base, dayIdx: base + 1, checkIdx: base + 2 };
  });

  // Build rows
  const rows: Record<number, any> = {};
  const merges: string[] = [];

  // Row 0: Fixed headers (merged dọc với row 1) + Month headers merge ngang
  const row0Cells: Record<number, any> = {};
  for (let c = 0; c < fixedHeaders.length; c++) {
    // cell.merge: [rowSpan, colSpan] — merge dọc 1 row (row 0 + row 1)
    row0Cells[c] = { text: fixedHeaders[c], style: 0, merge: [1, 0] };
    merges.push(`${cellRef(0, c)}:${cellRef(1, c)}`);
  }
  // Month headers — mỗi tháng 1 màu, merge ngang qua tất cả cột ngày
  for (const mo of monthOffsets) {
    const monthNum = mo.label.replace("T", "");
    const ms = monthStyleMap[mo.label];
    const hStyle = ms?.headerIdx ?? 0;
    if (mo.days > 1) {
      row0Cells[mo.startCol] = { text: `THÁNG ${monthNum}`, style: hStyle, merge: [0, mo.days - 1] };
      merges.push(`${cellRef(0, mo.startCol)}:${cellRef(0, mo.startCol + mo.days - 1)}`);
      for (let d = 1; d < mo.days; d++) {
        row0Cells[mo.startCol + d] = { text: "", style: hStyle };
      }
    } else {
      row0Cells[mo.startCol] = { text: `THÁNG ${monthNum}`, style: hStyle };
    }
  }
  rows[0] = { cells: row0Cells, height: 30 };

  // Row 1: Empty cells cho fixed cols (bị merge dọc) + Day numbers
  const row1Cells: Record<number, any> = {};
  for (let c = 0; c < fixedHeaders.length; c++) {
    row1Cells[c] = { text: "", style: 0 };
  }
  for (const mo of monthOffsets) {
    const ms = monthStyleMap[mo.label];
    const dStyle = ms?.dayIdx ?? 0;
    for (let d = 1; d <= mo.days; d++) {
      row1Cells[mo.startCol + d - 1] = { text: String(d), style: dStyle };
    }
  }
  rows[1] = { cells: row1Cells, height: 25 };

  // Xây dựng nhóm ngày để merge cột Ngày (col 0)
  const dateGroups: { start: number; end: number; date: string }[] = [];
  if (items.length > 0) {
    let gs = 0;
    for (let i = 1; i <= items.length; i++) {
      const cur = i < items.length ? (items[i].assignedDate || "—") : null;
      const prev = items[gs].assignedDate || "—";
      if (cur !== prev) {
        dateGroups.push({ start: gs, end: i - 1, date: prev });
        gs = i;
      }
    }
  }

  // Data rows starting from row 2
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rowIdx = i + 2;
    const cells: Record<number, any> = {};

    // Cột Ngày: dòng đầu nhóm có merge span, dòng sau để trống
    const group = dateGroups.find((g) => i >= g.start && i <= g.end);
    const isGroupFirst = group ? i === group.start : true;
    const groupSize = group ? group.end - group.start : 0;
    if (isGroupFirst && groupSize > 0) {
      cells[0] = { text: item.assignedDate || "—", style: 4, merge: [groupSize, 0] };
    } else if (isGroupFirst) {
      cells[0] = { text: item.assignedDate || "—", style: 4 };
    } else {
      cells[0] = { text: "", style: 4 };
    }

    cells[1] = { text: item.employeeName || "—", style: 1 };
    cells[2] = { text: item.agentCode || "—", style: 1 };
    cells[3] = { text: item.username || "—", style: 1 };
    cells[4] = { text: item.contactInfo || "—", style: 1 };
    cells[5] = { text: item.source || "—", style: 1 };
    cells[6] = { text: item.referralAccount || "—", style: 1 };
    cells[7] = { text: fmtDeposit(item.firstDeposit), style: 2 };

    // Calendar cells — mỗi tháng có màu check riêng
    const onlineSet = new Set(item.onlineDays || []);
    for (const mo of monthOffsets) {
      const ms = monthStyleMap[mo.label];
      const checkStyle = ms?.checkIdx ?? 3;
      for (let d = 1; d <= mo.days; d++) {
        const key = `${mo.label}-${d}`;
        const colIdx = mo.startCol + d - 1;
        if (onlineSet.has(key)) {
          cells[colIdx] = { text: "✓", style: checkStyle };
        } else {
          cells[colIdx] = { text: "", style: 3 };
        }
      }
    }

    rows[rowIdx] = { cells, height: 24 };
  }

  // Merge cột Ngày (col 0) qua merges array (dùng cho rendering)
  for (const g of dateGroups) {
    if (g.end > g.start) {
      const rowStart = g.start + 2;
      const rowEnd = g.end + 2;
      merges.push(`${cellRef(rowStart, 0)}:${cellRef(rowEnd, 0)}`);
    }
  }

  // Column widths
  const cols: Record<number | string, any> = { len: totalCols };
  const fixedWidths = [85, 80, 65, 110, 100, 65, 90, 85];
  for (let c = 0; c < fixedWidths.length; c++) {
    cols[c] = { width: fixedWidths[c] };
  }
  // Calendar day columns: narrow
  for (let c = fixedColCount; c < totalCols; c++) {
    cols[c] = { width: 28 };
  }

  return {
    name: "Khách hàng",
    styles,
    merges,
    rows: {
      len: items.length + 2,
      ...rows,
    },
    cols,
    freeze: "I3", // Freeze 8 cột cố định (đến Nạp lần đầu) + 2 header rows
  };
}

/** Cell reference: row 0, col 0 → "A1" */
function cellRef(row: number, col: number): string {
  let colStr = "";
  let c = col;
  while (c >= 0) {
    colStr = String.fromCharCode(65 + (c % 26)) + colStr;
    c = Math.floor(c / 26) - 1;
  }
  return `${colStr}${row + 1}`;
}

/** Parse date string (dd/mm/yyyy hoặc yyyy-mm-dd) → timestamp số */
function parseDate(s: string): number {
  if (!s) return 0;
  // dd/mm/yyyy
  const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    return new Date(+slashMatch[3], +slashMatch[2] - 1, +slashMatch[1]).getTime();
  }
  // yyyy-mm-dd
  const dashMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (dashMatch) {
    return new Date(+dashMatch[1], +dashMatch[2] - 1, +dashMatch[3]).getTime();
  }
  return 0;
}

function fmtDeposit(v: number | string | null): string {
  if (v === null || v === undefined || v === "") return "—";
  const num = typeof v === "string" ? parseFloat(v) : v;
  if (isNaN(num)) return "—";
  return num.toLocaleString("vi-VN");
}

function initSpreadsheet() {
  if (!containerRef.value) return;
  // Clear previous instance
  containerRef.value.innerHTML = "";

  spreadsheet = new Spreadsheet(containerRef.value, {
    mode: "read",
    showToolbar: false,
    showContextmenu: false,
    showBottomBar: false,
    view: {
      height: () => containerRef.value!.clientHeight,
      width: () => containerRef.value!.clientWidth,
    },
    row: { len: 100, height: 24 },
    col: { len: 26, width: 80, indexWidth: 40, minWidth: 28 },
  });
}

function renderSpreadsheet() {
  if (!spreadsheet) return;
  const data = buildSheetData(pagedItems.value, calendarMonths.value);
  spreadsheet.loadData([data]);
}

function onPageChange(e: { current: number; limit: number }) {
  currentPage.value = e.current;
  pageLimit.value = e.limit;
  nextTick(() => renderSpreadsheet());
}

async function loadData() {
  loading.value = true;
  const loadingId = layer.load(0, { shade: true });
  try {
    const res = await exportOldCustomers({
      employee: searchForm.employee || undefined,
      agentCode: searchForm.agentCode || undefined,
      search: searchForm.search || undefined,
    });
    const d = res.data.data;
    allItems.value = d.items;
    totalCount.value = d.total;
    currentPage.value = 1;
    if (d.calendarMonths?.length) {
      calendarMonths.value = d.calendarMonths;
    }
    await nextTick();
    renderSpreadsheet();
  } catch {
    layer.msg(t("common.errorLoad"), { icon: 2 });
  } finally {
    layer.close(loadingId);
    loading.value = false;
  }
}

async function loadSummary() {
  try {
    const res = await fetchOldCustomerSummary();
    summary.value = res.data.data;
    if (res.data.data.calendarMonths?.length) {
      calendarMonths.value = res.data.data.calendarMonths;
    }
  } catch {
    // silent
  }
}

function handleSearch() {
  loadData();
}

function handleReset() {
  searchForm.employee = "";
  searchForm.agentCode = "";
  searchForm.search = "";
  loadData();
}

function triggerUpload() {
  fileInputRef.value?.click();
}

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  uploading.value = true;
  const loadingId = layer.load(0, { shade: true });
  try {
    const res = await uploadOldCustomerFile(file);
    const d = res.data.data;
    if (d.calendarMonths?.length) {
      calendarMonths.value = d.calendarMonths;
    }
    layer.msg(
      t("oldCustomers.uploadSuccess", { customers: d.insertedRows.toLocaleString(), employees: d.employeeNames.length }),
      { icon: 1, time: 3000 },
    );
    loadData();
    loadSummary();
  } catch {
    layer.msg(t("oldCustomers.uploadError"), { icon: 2, time: 2000 });
  } finally {
    layer.close(loadingId);
    uploading.value = false;
    input.value = "";
  }
}

/** Yield control back to browser — tránh đơ UI khi xử lý nặng */
function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** Export to XLSX using ExcelJS — giống chính xác spreadsheet, non-blocking */
async function handleExportXlsx() {
  if (sortedItems.value.length === 0) {
    layer.msg("Không có dữ liệu để xuất", { icon: 0 });
    return;
  }

  const loadingId = layer.load(0, { shade: true });
  try {
    // Yield để loading overlay hiển thị
    await yieldToMain();

    const ExcelJS = await import("exceljs");
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Khách hàng");

    const sorted = ensureRecent3Months(calendarMonths.value);
    const exportItems = sortedItems.value;

    // Màu tháng giống spreadsheet (check chỉ dùng font color, không fill)
    const xlColors = [
      { header: "FF42A5F5", day: "FFE3F2FD", checkFont: "FF1565C0" },
      { header: "FFEF5350", day: "FFFCE4EC", checkFont: "FFC62828" },
      { header: "FF66BB6A", day: "FFE8F5E9", checkFont: "FF2E7D32" },
    ];

    // Reusable style objects — tạo factory để tránh share reference
    const mkBorder = (): Partial<ExcelJS.Borders> => ({
      top: { style: "thin", color: { argb: "FFE0E0E0" } },
      bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
      left: { style: "thin", color: { argb: "FFE0E0E0" } },
      right: { style: "thin", color: { argb: "FFE0E0E0" } },
    });
    const mkFill = (argb: string): ExcelJS.FillPattern => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
    const cAlign: Partial<ExcelJS.Alignment> = { horizontal: "center", vertical: "middle" };
    const lAlign: Partial<ExcelJS.Alignment> = { horizontal: "left", vertical: "middle" };
    const rAlign: Partial<ExcelJS.Alignment> = { horizontal: "right", vertical: "middle" };

    const fixedHeaders = ["Ngày", "NV", "Đại lý", "Tài khoản", "Liên hệ", "Nguồn", "Giới thiệu", "Nạp lần đầu"];
    const fixedColCount = fixedHeaders.length;

    // Month offsets
    const monthOffsets: { label: string; days: number; startCol: number; colorIdx: number }[] = [];
    let totalCalCols = 0;
    sorted.forEach((m, idx) => {
      monthOffsets.push({ label: m.label, days: m.days, startCol: fixedColCount + totalCalCols, colorIdx: idx });
      totalCalCols += m.days;
    });

    // === HEADERS ===
    const row1Data: string[] = [...fixedHeaders];
    for (const mo of monthOffsets) {
      row1Data.push(`THÁNG ${mo.label.replace("T", "")}`);
      for (let d = 2; d <= mo.days; d++) row1Data.push("");
    }
    ws.addRow(row1Data).height = 28;

    const row2Data: string[] = fixedHeaders.map(() => "");
    for (const mo of monthOffsets) {
      for (let d = 1; d <= mo.days; d++) row2Data.push(String(d));
    }
    ws.addRow(row2Data).height = 22;

    // Merge + style fixed headers
    for (let c = 1; c <= fixedColCount; c++) {
      ws.mergeCells(1, c, 2, c);
      const cell = ws.getCell(1, c);
      cell.font = { bold: true, size: 10 };
      cell.alignment = cAlign;
      cell.fill = mkFill("FFF2F2F2");
      cell.border = mkBorder();
    }

    // Merge + style month headers
    for (const mo of monthOffsets) {
      const col1 = mo.startCol + 1;
      if (mo.days > 1) ws.mergeCells(1, col1, 1, col1 + mo.days - 1);
      const mc = xlColors[mo.colorIdx];
      const hCell = ws.getCell(1, col1);
      hCell.font = { bold: true, size: 10 };
      hCell.alignment = cAlign;
      hCell.fill = mkFill(mc.header);
      hCell.border = mkBorder();
      for (let d = 0; d < mo.days; d++) {
        const dc = ws.getCell(2, col1 + d);
        dc.font = { bold: true, size: 9 };
        dc.alignment = cAlign;
        dc.fill = mkFill(mc.day);
        dc.border = mkBorder();
      }
    }

    // === DATA ROWS — chunked để không block UI ===
    const maxWidths: number[] = new Array(fixedColCount).fill(0);
    fixedHeaders.forEach((h, i) => { maxWidths[i] = h.length; });

    const CHUNK = 500; // xử lý 500 rows/lần
    for (let chunk = 0; chunk < exportItems.length; chunk += CHUNK) {
      const end = Math.min(chunk + CHUNK, exportItems.length);
      for (let i = chunk; i < end; i++) {
        const item = exportItems[i];
        const onlineSet = new Set(item.onlineDays || []);
        const vals: (string | number)[] = [
          item.assignedDate || "—",
          item.employeeName || "—",
          item.agentCode || "—",
          item.username || "—",
          item.contactInfo || "—",
          item.source || "—",
          item.referralAccount || "—",
          item.firstDeposit != null ? Number(item.firstDeposit) : 0,
        ];
        for (const mo of monthOffsets) {
          for (let d = 1; d <= mo.days; d++) {
            vals.push(onlineSet.has(`${mo.label}-${d}`) ? "✓" : "");
          }
        }
        ws.addRow(vals).height = 20;

        // Track widths
        for (let c = 0; c < fixedColCount; c++) {
          const len = String(vals[c]).length;
          if (len > maxWidths[c]) maxWidths[c] = len;
        }

        // Style cells
        const rowNum = i + 3;
        for (let c = 1; c <= fixedColCount; c++) {
          const cell = ws.getCell(rowNum, c);
          cell.border = mkBorder();
          if (c === 1) {
            cell.alignment = cAlign;
            cell.fill = mkFill("FFFAFAFA");
          } else if (c === fixedColCount) {
            cell.alignment = rAlign;
            if (typeof vals[c - 1] === "number" && (vals[c - 1] as number) > 0) cell.numFmt = "#,##0";
          } else {
            cell.alignment = lAlign;
          }
        }
        for (const mo of monthOffsets) {
          const mc = xlColors[mo.colorIdx];
          for (let d = 0; d < mo.days; d++) {
            const cell = ws.getCell(rowNum, mo.startCol + d + 1);
            cell.alignment = cAlign;
            cell.border = mkBorder();
            if (cell.value === "✓") {
              cell.font = { bold: true, color: { argb: mc.checkFont } };
            }
          }
        }
      }
      // Yield mỗi chunk
      if (end < exportItems.length) await yieldToMain();
    }

    // Merge cột Ngày
    if (exportItems.length > 0) {
      let gs = 0;
      for (let i = 1; i <= exportItems.length; i++) {
        const cur = i < exportItems.length ? (exportItems[i].assignedDate || "—") : null;
        const prev = exportItems[gs].assignedDate || "—";
        if (cur !== prev) {
          if (i - 1 > gs) ws.mergeCells(gs + 3, 1, i - 1 + 3, 1);
          gs = i;
        }
      }
    }

    // Column widths — auto-fit fixed, fixed cho calendar
    for (let c = 0; c < fixedColCount; c++) {
      ws.getColumn(c + 1).width = Math.min(Math.max(maxWidths[c] + 3, 8), 35);
    }
    for (const mo of monthOffsets) {
      for (let d = 0; d < mo.days; d++) ws.getColumn(mo.startCol + d + 1).width = 3.5;
    }

    // Freeze panes
    ws.views = [{ state: "frozen", xSplit: fixedColCount, ySplit: 2 }];

    // Yield trước khi tạo buffer (nặng nhất)
    await yieldToMain();
    const buffer = await wb.xlsx.writeBuffer();

    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `KhachHangCu_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    layer.msg("Xuất file thành công!", { icon: 1, time: 2000 });
  } catch (err) {
    console.error("Export error:", err);
    layer.msg("Lỗi xuất file", { icon: 2 });
  } finally {
    layer.close(loadingId);
  }
}

function handleNoteAdded() {
  loadData();
  loadSummary();
}

onMounted(() => {
  nextTick(() => {
    initSpreadsheet();
    loadData();
    loadSummary();
  });
});

onBeforeUnmount(() => {
  spreadsheet = null;
});
</script>

<template>
  <div class="oc-page">
    <lay-card>
      <lay-field :title="t('oldCustomers.title')">
        <div class="search-form-wrap">
          <div class="layui-inline">
            <span class="form-label">{{ t("oldCustomers.filterEmployee") }}</span>
            <lay-select v-model="searchForm.employee" :placeholder="t('common.all')" allow-clear style="width: 180px">
              <lay-select-option
                v-for="opt in employeeOptions"
                :key="opt.value"
                :value="opt.value"
                :label="opt.label"
              />
            </lay-select>
          </div>
          <div class="layui-inline">
            <span class="form-label">{{ t("oldCustomers.filterAgent") }}</span>
            <lay-select v-model="searchForm.agentCode" :placeholder="t('common.all')" allow-clear style="width: 160px">
              <lay-select-option
                v-for="opt in agentOptions"
                :key="opt.value"
                :value="opt.value"
                :label="opt.label"
              />
            </lay-select>
          </div>
          <div class="layui-inline">
            <span class="form-label">{{ t("oldCustomers.colUsername") }}</span>
            <lay-input
              v-model="searchForm.search"
              :placeholder="t('oldCustomers.searchPlaceholder')"
            />
          </div>
          <div class="layui-inline btn-group">
            <lay-button type="normal" @click="handleSearch">
              <i class="layui-icon layui-icon-search"></i> {{ t("common.search") }}
            </lay-button>
            <lay-button type="primary" @click="handleReset">
              <i class="layui-icon layui-icon-refresh"></i> {{ t("common.reset") }}
            </lay-button>
            <template v-if="canExport">
              <lay-button @click="triggerUpload" :loading="uploading">
                <i class="layui-icon layui-icon-upload"></i> {{ t("oldCustomers.upload") }}
              </lay-button>
              <lay-button type="primary" @click="noteDialogRef?.open()">
                <i class="layui-icon layui-icon-note"></i> {{ t("noteCustomer.btn") }}
              </lay-button>
              <lay-button type="warm" @click="handleExportXlsx" :disabled="sortedItems.length === 0">
                <i class="layui-icon layui-icon-export"></i> Xuất XLSX
              </lay-button>
              <input
                ref="fileInputRef"
                type="file"
                accept=".xlsx,.xls"
                style="display: none"
                @change="handleFileUpload"
              />
            </template>
          </div>
        </div>
      </lay-field>

      <div ref="containerRef" class="spreadsheet-container"></div>

      <div class="oc-pager">
        <lay-page
          v-model="currentPage"
          v-model:limit="pageLimit"
          :total="totalCount"
          :limits="[50, 100, 200, 500, 1000]"
          :layout="['count', 'prev', 'page', 'next', 'limits', 'skip']"
          @change="onPageChange"
        />
      </div>
    </lay-card>

    <NoteCustomerDialog ref="noteDialogRef" @added="handleNoteAdded" />
  </div>
</template>

<style scoped>
.oc-page {
  height: calc(100vh - 130px);
  display: flex;
  flex-direction: column;
}
.oc-page :deep(.layui-card) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.oc-page :deep(.layui-card-body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.spreadsheet-container {
  flex: 1;
  min-height: 300px;
  overflow: hidden;
}
.oc-pager {
  padding: 6px 10px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.btn-group {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
</style>
