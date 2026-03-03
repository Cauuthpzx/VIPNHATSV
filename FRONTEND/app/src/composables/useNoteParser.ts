/**
 * Composable: parse raw text (từ Telegram/Zalo) thành danh sách khách hàng
 *
 * Hỗ trợ 2 format:
 *
 * Format 1 (header "更新 Xiao Yan"):
 *   翠贤 BUN, [3/3/2026 8:47 PM]   ← Telegram timestamp (bỏ qua)
 *   更新 Xiao Yan                   ← employee header
 *   nguyentienabc                   ← username
 *   tele Hoàngacccccc               ← liên hệ
 *   300K                            ← deposit
 *   VIA BÓNG                        ← nguồn
 *   huangxie05                      ← đại lý
 *
 * Format 2 (header "ĐẠI Lý:"):
 *   ĐẠI Lý: huangxie02
 *   TÊN TK : Phihong1984
 *   ZALO TELE: Zalo: Vi Q Tý
 *   100k  VIA
 */

export interface ParsedCustomer {
  assignedDate: string;
  employeeName: string;
  agentCode: string;
  username: string;
  contactInfo: string;
  source: string;
  referralAccount: string;
  firstDeposit: number | null;
}

/** Telegram/Zalo message timestamp: "翠贤 BUN, [3/3/2026 8:47 PM]" */
const TELEGRAM_HEADER_RE = /^.+,\s*\[[\d/]+\s+[\d:]+\s*(AM|PM)?\s*\]$/i;

/**
 * Normalize deposit string → number
 * "100K" → 100000, "1m" → 1000000, "300k" → 300000, "500" → 500000
 */
export function normalizeDeposit(raw: string): number | null {
  if (!raw) return null;
  const s = raw.trim().replace(/,/g, "");
  const match = s.match(/^(\d+(?:\.\d+)?)\s*(k|m)?$/i);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const suffix = (match[2] || "").toLowerCase();
  if (suffix === "m") return num * 1_000_000;
  if (suffix === "k") return num * 1_000;
  // Số < 1000 không có suffix → đơn vị K
  if (num < 1000) return num * 1_000;
  return num;
}

/** Kiểm tra dòng có phải telegram header timestamp không */
function isTelegramHeader(line: string): boolean {
  return TELEGRAM_HEADER_RE.test(line);
}

/**
 * Extract date từ Telegram header nếu có: "翠贤 BUN, [3/3/2026 8:47 PM]"
 * Returns YYYY-MM-DD hoặc null
 */
function extractTelegramDate(line: string): string | null {
  const m = line.match(/\[(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  const month = m[1].padStart(2, "0");
  const day = m[2].padStart(2, "0");
  return `${m[3]}-${month}-${day}`;
}

/**
 * Format 1: header bắt đầu bằng "更新"
 *
 * Block gồm tối đa 5 dòng data (sau header):
 * 1. Username (alphanumeric, no spaces)
 * 2. tele/zalo + tên liên hệ → contactInfo
 * 3. Số tiền (100K, 300K, 1m)
 * 4. VIA + nguồn
 * 5. Đại lý (huangxie05)
 */
function parseFormat1(lines: string[], today: string): ParsedCustomer[] {
  const results: ParsedCustomer[] = [];
  let i = 0;
  let currentDate = today;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Bỏ qua Telegram header nhưng extract date nếu có
    if (isTelegramHeader(line)) {
      const d = extractTelegramDate(line);
      if (d) currentDate = d;
      i++;
      continue;
    }

    // Tìm header: dòng bắt đầu bằng "更新"
    if (/^更新\s+/i.test(line)) {
      // Extract employee name từ header: "更新 Xiao Yan" → "Xiao Yan"
      const empMatch = line.match(/^更新\s+(?:[\u4e00-\u9fff]+\s+)?(.+)/i);
      const employeeName = empMatch ? empMatch[1].trim() : line.replace(/^更新\s*/i, "").trim();

      // Đọc các dòng tiếp theo trong block
      const blockLines: string[] = [];
      i++;
      while (i < lines.length && blockLines.length < 5) {
        const next = lines[i].trim();
        if (!next) { i++; continue; }
        // Dừng nếu gặp header mới hoặc Telegram header
        if (/^更新\s+/i.test(next)) break;
        if (isTelegramHeader(next)) break;
        // Dừng nếu gặp format 2 header
        if (/^[ĐD](?:[ẠA]I)\s*L[Ýý]\s*:/i.test(next)) break;
        blockLines.push(next);
        i++;
      }

      if (blockLines.length >= 4) {
        const username = blockLines[0].trim().toLowerCase();
        const contactInfo = blockLines[1].trim();
        const depositRaw = blockLines[2].trim();
        const viaLine = blockLines[3].trim();
        const agentCode = blockLines.length >= 5 ? blockLines[4].trim() : "";

        // Parse source từ VIA line
        const viaMatch = viaLine.match(/^VIA\s*(.*)/i);
        const source = viaMatch ? `VIA ${viaMatch[1] || ""}`.trim() : viaLine;

        // Parse deposit: chỉ lấy phần số + suffix
        const depositMatch = depositRaw.match(/(\d+(?:\.\d+)?)\s*(k|m)?/i);
        const depositStr = depositMatch
          ? depositMatch[1] + (depositMatch[2] || "")
          : depositRaw;

        results.push({
          assignedDate: currentDate,
          employeeName,
          agentCode,
          username,
          contactInfo,
          source,
          referralAccount: "",
          firstDeposit: normalizeDeposit(depositStr),
        });
      }
      continue;
    }
    i++;
  }

  return results;
}

/**
 * Format 2: header bắt đầu bằng "ĐẠI Lý:" hoặc "ĐẠI LÝ:"
 *
 * Block:
 *   ĐẠI Lý: huangxie02
 *   TÊN TK : Phihong1984
 *   ZALO TELE: Zalo: Vi Q Tý
 *   [SĐT : *****239]   ← bỏ qua
 *   100k  VIA
 */
function parseFormat2(lines: string[], today: string): ParsedCustomer[] {
  const results: ParsedCustomer[] = [];
  let i = 0;
  let currentDate = today;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Bỏ qua Telegram header nhưng extract date
    if (isTelegramHeader(line)) {
      const d = extractTelegramDate(line);
      if (d) currentDate = d;
      i++;
      continue;
    }

    // Tìm header "ĐẠI Lý:" hoặc "ĐẠI LÝ:"
    const agentMatch = line.match(/^[ĐD](?:[ẠA]I)\s*L[Ýý]\s*:\s*(.+)/i);
    if (agentMatch) {
      const agentCode = agentMatch[1].trim();
      let username = "";
      let contactInfo = "";
      let depositStr = "";
      let source = "VIA";

      i++;
      while (i < lines.length) {
        const next = lines[i].trim();
        if (!next) { i++; continue; }
        // Dừng nếu gặp block mới
        if (/^[ĐD](?:[ẠA]I)\s*L[Ýý]\s*:/i.test(next)) break;
        if (isTelegramHeader(next)) break;
        if (/^更新\s+/i.test(next)) break;

        // TÊN TK
        const tkMatch = next.match(/^T[EÊ]N\s+TK\s*:\s*(.+)/i);
        if (tkMatch) {
          username = tkMatch[1].trim().toLowerCase();
          i++;
          continue;
        }

        // ZALO TELE / Liên hệ
        const contactMatch = next.match(/^(?:ZALO|TELE|ZALO\s*TELE|LI[ÊE]N\s*H[ÊE])\s*:\s*(.+)/i);
        if (contactMatch) {
          contactInfo = contactMatch[1].trim();
          i++;
          continue;
        }

        // SĐT → bỏ qua
        if (/^S[ĐD]T\s*:/i.test(next)) {
          i++;
          continue;
        }

        // Deposit + VIA line: "100k  VIA" hoặc "1m  VIA"
        const depositViaMatch = next.match(/^(\d+(?:\.\d+)?)\s*(k|m)?\s+VIA\b/i);
        if (depositViaMatch) {
          depositStr = depositViaMatch[1] + (depositViaMatch[2] || "");
          const afterVia = next.match(/VIA\s+(.*)/i);
          if (afterVia && afterVia[1].trim()) {
            source = `VIA ${afterVia[1].trim()}`;
          }
          i++;
          continue;
        }

        // Dòng chỉ có số tiền (không có VIA)
        const pureDeposit = next.match(/^(\d+(?:\.\d+)?)\s*(k|m)?\s*$/i);
        if (pureDeposit && username) {
          depositStr = pureDeposit[1] + (pureDeposit[2] || "");
          i++;
          continue;
        }

        i++;
      }

      if (username) {
        results.push({
          assignedDate: currentDate,
          employeeName: "",
          agentCode,
          username,
          contactInfo,
          source,
          referralAccount: "",
          firstDeposit: normalizeDeposit(depositStr),
        });
      }
      continue;
    }
    i++;
  }

  return results;
}

/**
 * Pre-process: lọc bỏ các dòng không cần thiết
 */
function preprocessLines(rawText: string): string[] {
  return rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/**
 * Detect format và parse text
 */
export function parseNoteText(rawText: string): ParsedCustomer[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = preprocessLines(rawText);
  if (lines.length === 0) return [];

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Detect format
  const hasFormat2 = lines.some((l) => /^[ĐD](?:[ẠA]I)\s*L[Ýý]\s*:/i.test(l));
  const hasFormat1 = lines.some((l) => /^更新\s+/i.test(l));

  let results: ParsedCustomer[] = [];

  // Có thể cả 2 format trong cùng 1 text → parse cả 2
  if (hasFormat1) {
    results = results.concat(parseFormat1(lines, today));
  }
  if (hasFormat2) {
    results = results.concat(parseFormat2(lines, today));
  }

  if (results.length === 0) {
    return [];
  }

  // Sắp xếp theo ngày (ngày cũ trước)
  results.sort((a, b) => a.assignedDate.localeCompare(b.assignedDate));

  return results;
}

export function useNoteParser() {
  return { parseNoteText, normalizeDeposit };
}
