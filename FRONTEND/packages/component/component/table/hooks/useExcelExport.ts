/**
 * useExcelExport — Xuất XLSX với styling giống hệt GUI.
 *
 * Dùng ExcelJS để tạo file XLSX thực sự với:
 * - Font, border, fill, alignment, column width, row height
 * - Multi-level header (merge cells)
 * - Màu nền header/cell theo nhóm (exportHeaderColor, exportCellColor)
 * - Format số giống lay-count-up trên GUI
 */
import ExcelJS from "exceljs";

// --- Types (tái sử dụng từ lay-table, mở rộng cho export) ---
interface ExportColumn {
  title: string;
  key?: string;
  type?: string;
  width?: string;
  minWidth?: string;
  align?: string;
  children?: ExportColumn[];
  ignoreExport?: boolean;
  customSlot?: string;
  exportCellType?: string;
  // Mở rộng cho export
  exportTitle?: string;       // Tiêu đề export (fallback khi title rỗng do dùng titleSlot)
  exportHeaderColor?: string; // Màu nền header hex (VD: "CCE5FF")
  exportCellColor?: string;   // Màu nền data cell hex (VD: "F0F7FF")
  [key: string]: any;
}

interface ExportOptions {
  fileName?: string;
  sheetName?: string;
  getColSpan?: (col: ExportColumn) => number;
  getRowSpan?: (col: ExportColumn) => number;
  spanMethod?: (row: any, col: ExportColumn, rowIdx: number, colIdx: number) => [number, number] | undefined;
}

// --- Styling constants ---
const HEADER_FONT: Partial<ExcelJS.Font> = {
  name: "Arial", size: 11, bold: true, color: { argb: "FF333333" },
};

const DATA_FONT: Partial<ExcelJS.Font> = {
  name: "Arial", size: 10, color: { argb: "FF333333" },
};

const DEFAULT_HEADER_FILL: ExcelJS.FillPattern = {
  type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" },
};

const HEADER_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFD0D0D0" } },
  bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
  left: { style: "thin", color: { argb: "FFD0D0D0" } },
  right: { style: "thin", color: { argb: "FFD0D0D0" } },
};

const DATA_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFE8E8E8" } },
  bottom: { style: "thin", color: { argb: "FFE8E8E8" } },
  left: { style: "thin", color: { argb: "FFE8E8E8" } },
  right: { style: "thin", color: { argb: "FFE8E8E8" } },
};

const HEADER_ROW_HEIGHT = 28;
const DATA_ROW_HEIGHT = 22;

// --- Format helpers ---

/** Lấy tiêu đề export: exportTitle → title → "" */
function getExportTitle(col: ExportColumn): string {
  return col.exportTitle || col.title || "";
}

/** Tạo fill từ hex color string (VD: "CCE5FF" → FillPattern) */
function makeFill(hex: string | undefined): ExcelJS.FillPattern {
  if (!hex) return DEFAULT_HEADER_FILL;
  const argb = "FF" + hex.replace(/^#/, "");
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

/** Replicate lay-count-up "num" format: toFixed(hasDecimal ? 2 : 0) */
function formatNumValue(raw: any): number {
  if (raw == null || raw === "") return 0;
  const str = String(raw);
  const num = Number(raw) || 0;
  const hasDecimal = str.includes(".");
  return Number(num.toFixed(hasDecimal ? 2 : 0));
}

/** Replicate lay-count-up "sumNum" format: toFixed(hasDecimal ? 4 : 0) */
function formatSumNumValue(raw: any): number {
  if (raw == null || raw === "") return 0;
  const str = String(raw);
  const num = Number(raw) || 0;
  const hasDecimal = str.includes(".");
  return Number(num.toFixed(hasDecimal ? 4 : 0));
}

/** Convert column.width (e.g. "120px", "80px") → character width */
function pxToCharWidth(px: string | undefined): number | null {
  if (!px) return null;
  const match = px.match(/^(\d+)/);
  if (!match) return null;
  return Math.max(8, Math.round(Number(match[1]) / 7));
}

/** Estimate display length of a formatted number (with thousands separators) */
function formattedNumLength(val: any): number {
  if (val == null || val === "") return 0;
  const num = Number(val);
  if (isNaN(num)) return String(val).length;
  // Approximate: the number + commas + possible decimal
  const formatted = num.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return formatted.length;
}

/** Auto-calculate column width from data */
function calcAutoWidth(title: string, data: any[], key: string | undefined, isNumeric = false): number {
  let maxLen = title.length;
  if (key) {
    for (const row of data.slice(0, 100)) {
      const val = row[key];
      const len = isNumeric ? formattedNumLength(val) : (val != null ? String(val).length : 0);
      if (len > maxLen) maxLen = len;
    }
  }
  return Math.min(50, Math.max(8, Math.round(maxLen * 1.2) + 3));
}

/** Kiểm tra customSlot có phải dạng số không */
const NUMERIC_SLOTS = new Set([
  "num", "money", "sumNum", "winLose",
  "onlineCount", "todayCell", "todayMoney", "monthMoney", "monthWinLose",
]);

function isNumericSlot(slot: string | undefined): boolean {
  return !!slot && NUMERIC_SLOTS.has(slot);
}

/** Format cell value dựa trên customSlot */
function formatCellValue(raw: any, customSlot: string | undefined): any {
  if (!customSlot) return raw ?? "";

  switch (customSlot) {
    case "num":
    case "money":
    case "winLose":
    case "todayMoney":
    case "monthMoney":
    case "monthWinLose":
      return formatNumValue(raw);
    case "sumNum":
      return formatSumNumValue(raw);
    case "onlineCount":
    case "todayCell":
      return raw != null ? (Number(raw) || 0) : 0;
    default:
      return raw ?? "";
  }
}

// --- Build column→color map from hierarchical columns ---
// Duyệt qua columns tree, propagate exportHeaderColor/exportCellColor xuống children
function buildColorMaps(
  hierarchicalColumns: ExportColumn[][],
  leafColumns: ExportColumn[],
): { headerColorMap: Map<ExportColumn, string>; cellColorMap: Map<ExportColumn, string> } {
  const headerColorMap = new Map<ExportColumn, string>();
  const cellColorMap = new Map<ExportColumn, string>();

  // Recursive: propagate color from parent to leaf
  function propagate(cols: ExportColumn[], parentHeaderColor?: string, parentCellColor?: string) {
    for (const col of cols) {
      const hColor = col.exportHeaderColor || parentHeaderColor;
      const cColor = col.exportCellColor || parentCellColor;
      if (hColor) headerColorMap.set(col, hColor);
      if (cColor) cellColorMap.set(col, cColor);
      if (col.children) {
        propagate(col.children, hColor, cColor);
      }
    }
  }

  // Process all levels
  for (const row of hierarchicalColumns) {
    propagate(row);
  }

  return { headerColorMap, cellColorMap };
}

// --- Main export function ---

export async function exportToXlsx(
  hierarchicalColumns: ExportColumn[][],
  lastLevelColumns: ExportColumn[],
  dataSource: any[],
  options: ExportOptions = {},
): Promise<void> {
  const {
    fileName = "Sheet1",
    sheetName = "Sheet1",
    getColSpan,
    getRowSpan,
  } = options;

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet(sheetName);

  // Filter exportable leaf columns
  const exportLeafCols = lastLevelColumns.filter((c) => {
    if (c.ignoreExport) return false;
    if (c.type && c.type !== "number") return false;
    return true;
  });

  const totalCols = exportLeafCols.length;

  // Build color maps
  const { headerColorMap, cellColorMap } = buildColorMaps(hierarchicalColumns, exportLeafCols);

  // ======= HEADER ROWS =======
  const merges: string[] = [];
  let headerRowCount = 0;
  const totalHeaderLevels = hierarchicalColumns.length;

  // Track which Excel columns are already occupied by merged cells from previous rows
  // occupiedCols[excelRow][excelCol] = true if that cell is part of a merge from above
  const occupiedCols: Map<number, Set<number>> = new Map();

  for (let rowIdx = 0; rowIdx < totalHeaderLevels; rowIdx++) {
    const headerRow = ws.addRow([]);
    headerRow.height = HEADER_ROW_HEIGHT;
    headerRowCount++;

    const excelRowNum = rowIdx + 1;
    if (!occupiedCols.has(excelRowNum)) occupiedCols.set(excelRowNum, new Set());

    let colPos = 1;

    for (const col of hierarchicalColumns[rowIdx]) {
      if (col.ignoreExport) continue;
      if (col.type && col.type !== "number") continue;

      const colspan = getColSpan ? getColSpan(col) : 1;
      const rowspan = getRowSpan ? getRowSpan(col) : 1;

      // Skip past columns occupied by merged cells from previous rows
      while (occupiedCols.get(excelRowNum)?.has(colPos)) {
        colPos++;
      }

      const cell = headerRow.getCell(colPos);
      cell.value = getExportTitle(col);
      cell.font = HEADER_FONT;
      cell.fill = headerColorMap.has(col) ? makeFill(headerColorMap.get(col)) : DEFAULT_HEADER_FILL;
      cell.border = HEADER_BORDER;
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

      if (colspan > 1 || rowspan > 1) {
        const startRow = excelRowNum;
        const endRow = startRow + rowspan - 1;
        const startCol = colPos;
        const endCol = colPos + colspan - 1;
        if (endRow > startRow || endCol > startCol) {
          merges.push(`${getCellRef(startRow, startCol)}:${getCellRef(endRow, endCol)}`);
        }
        // Mark occupied cells for subsequent rows
        for (let r = startRow; r <= endRow; r++) {
          if (!occupiedCols.has(r)) occupiedCols.set(r, new Set());
          for (let c = startCol; c <= endCol; c++) {
            if (r !== excelRowNum) { // Don't mark current row (we handle colPos ourselves)
              occupiedCols.get(r)!.add(c);
            }
          }
        }
      }

      colPos += colspan;
    }
  }

  // Apply merges
  for (const merge of merges) {
    try { ws.mergeCells(merge); } catch { /* skip overlap */ }
  }

  // Style merged header cells that didn't get styled (ExcelJS quirk)
  for (let r = 1; r <= headerRowCount; r++) {
    const row = ws.getRow(r);
    for (let c = 1; c <= totalCols; c++) {
      const cell = row.getCell(c);
      if (!cell.font || !cell.font.bold) {
        cell.font = HEADER_FONT;
        cell.fill = DEFAULT_HEADER_FILL;
        cell.border = HEADER_BORDER;
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      }
    }
  }

  // ======= DATA ROWS =======
  dataSource.forEach((item, rowIndex) => {
    const rowValues: any[] = [];

    exportLeafCols.forEach((col) => {
      if (col.type === "number") {
        rowValues.push(rowIndex + 1);
        return;
      }

      const raw = col.key ? item[col.key] : "";

      if (isNumericSlot(col.customSlot)) {
        rowValues.push(formatCellValue(raw, col.customSlot));
      } else if (col.exportCellType || typeof raw === "number" || (raw != null && !isNaN(Number(raw)) && String(raw).trim() !== "")) {
        const num = Number(raw);
        rowValues.push(isNaN(num) ? (raw ?? "") : num);
      } else {
        rowValues.push(raw ?? "");
      }
    });

    const excelRow = ws.addRow(rowValues);
    excelRow.height = DATA_ROW_HEIGHT;

    // Style data cells
    exportLeafCols.forEach((col, colIdx) => {
      const cell = excelRow.getCell(colIdx + 1);
      cell.font = DATA_FONT;
      cell.border = DATA_BORDER;

      // Cell background color
      const cellColor = cellColorMap.get(col);
      if (cellColor) {
        cell.fill = makeFill(cellColor);
      }

      // Alignment
      const isCenter = col.type === "number" || col.align === "center";
      const isRight = col.align === "right" || (isNumericSlot(col.customSlot) && !isCenter);

      cell.alignment = {
        horizontal: isCenter ? "center" : isRight ? "right" : "left",
        vertical: "middle",
      };

      // Number format
      if (typeof cell.value === "number") {
        const val = cell.value;
        if (col.customSlot === "sumNum") {
          cell.numFmt = val % 1 !== 0 ? "#,##0.0000" : "#,##0";
        } else if (col.customSlot === "num" || col.customSlot === "money" || col.customSlot === "winLose" || col.customSlot === "todayMoney" || col.customSlot === "monthMoney" || col.customSlot === "monthWinLose") {
          cell.numFmt = val % 1 !== 0 ? "#,##0.00" : "#,##0";
        }
      }
    });

    // Tree data children
    if (item.children) {
      exportChildren(ws, item.children, exportLeafCols, cellColorMap);
    }
  });

  // ======= COLUMN WIDTHS =======
  exportLeafCols.forEach((col, idx) => {
    const excelCol = ws.getColumn(idx + 1);
    const fromPx = pxToCharWidth(col.width || col.minWidth);
    const title = getExportTitle(col);
    const numeric = isNumericSlot(col.customSlot) || col.exportCellType === "number";
    const autoW = calcAutoWidth(title, dataSource, col.key, numeric);

    if (numeric) {
      // Số cần đủ rộng: lấy max giữa px-based và data-based
      excelCol.width = Math.max(fromPx ?? 8, autoW);
    } else if (fromPx) {
      excelCol.width = fromPx;
    } else {
      excelCol.width = autoW;
    }
  });

  // ======= FREEZE HEADER =======
  ws.views = [{ state: "frozen", ySplit: headerRowCount, xSplit: 0 }];

  // ======= GENERATE & DOWNLOAD =======
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Helpers ---

function getCellRef(row: number, col: number): string {
  let colStr = "";
  let c = col;
  while (c > 0) {
    c--;
    colStr = String.fromCharCode(65 + (c % 26)) + colStr;
    c = Math.floor(c / 26);
  }
  return colStr + row;
}

function exportChildren(
  ws: ExcelJS.Worksheet,
  children: any[],
  columns: ExportColumn[],
  cellColorMap: Map<ExportColumn, string>,
): void {
  children.forEach((item) => {
    const rowValues: any[] = [];
    columns.forEach((col) => {
      if (col.type === "number") { rowValues.push(""); return; }
      const raw = col.key ? item[col.key] : "";
      rowValues.push(isNumericSlot(col.customSlot) ? formatCellValue(raw, col.customSlot) : (raw ?? ""));
    });

    const excelRow = ws.addRow(rowValues);
    excelRow.height = DATA_ROW_HEIGHT;

    columns.forEach((col, colIdx) => {
      const cell = excelRow.getCell(colIdx + 1);
      cell.font = DATA_FONT;
      cell.border = DATA_BORDER;
      const cellColor = cellColorMap.get(col);
      if (cellColor) cell.fill = makeFill(cellColor);
      cell.alignment = {
        horizontal: col.align === "right" ? "right" : col.align === "center" ? "center" : "left",
        vertical: "middle",
      };
    });

    if (item.children) exportChildren(ws, item.children, columns, cellColorMap);
  });
}
