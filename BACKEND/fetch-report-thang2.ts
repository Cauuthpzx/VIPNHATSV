/**
 * fetch-report-thang2.ts
 * 3 request duy nhất đến web gốc ee88 — dùng tài khoản master (112233).
 * Tự động lấy tháng trước.
 * Cộng dồn theo tên tài khoản khách hàng (username).
 *
 * Usage: npx tsx fetch-report-thang2.ts
 */

import pg from 'pg';
import crypto from 'node:crypto';
import * as XLSX from 'xlsx';

// ── Config ──────────────────────────────────────────────────────────────────
const DATABASE_URL   = 'postgresql://postgres:hiepmun2021@localhost:5432/fastify_skeleton';
const ENCRYPTION_KEY = '8776e08b467ce91533905204397b4ee03139f883ca65fc20394f00dcc2ae4f7f';
const UPSTREAM_URL   = 'https://a2u4k.ee88dly.com';
const MAX_PER_PAGE   = 9999;       // upstream giới hạn tối đa per page

// Tự động lấy tháng trước
const now   = new Date();
const prev  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
const year  = prev.getFullYear();
const month = String(prev.getMonth() + 1).padStart(2, '0');
const lastDay = new Date(year, prev.getMonth() + 1, 0).getDate();
const DATE_FROM   = `${year}-${month}-01`;
const DATE_TO     = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
const DATE_RANGE  = `${DATE_FROM} | ${DATE_TO}`;   // format upstream nhận
const MONTH_LABEL = `${year}-${month}`;

// ── Decrypt cookie ──────────────────────────────────────────────────────────
function decryptAES(ct: string): string {
  const [ivHex, authHex, encHex] = ct.split(':');
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const dec = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex!, 'hex'));
  dec.setAuthTag(Buffer.from(authHex!, 'hex'));
  return dec.update(encHex!, 'hex', 'utf8') + dec.final('utf8');
}
function decryptCookie(s: string): string {
  return s.startsWith('enc:') ? decryptAES(s.slice(4)) : s;
}

// ── Fetch 1 page ────────────────────────────────────────────────────────────
async function fetchPage(
  path: string,
  cookie: string,
  page: number,
): Promise<{ data: Record<string, unknown>[]; count: number }> {
  const body = new URLSearchParams({
    page:  String(page),
    limit: String(MAX_PER_PAGE),
    date:  DATE_RANGE,
  });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 120_000);

  try {
    const res = await fetch(`${UPSTREAM_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type':     'application/x-www-form-urlencoded',
        'Cookie':           `PHPSESSID=${cookie}`,
        'User-Agent':       'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept':           'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer':          `${UPSTREAM_URL}/`,
        'Origin':           UPSTREAM_URL,
      },
      body: body.toString(),
      signal: ctrl.signal,
      redirect: 'manual',
    });

    if (res.status === 301 || res.status === 302)
      throw new Error(`Session expired (redirect ${res.status})`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    if (text.trimStart().startsWith('<')) throw new Error('Session expired (HTML response)');

    const json = JSON.parse(text) as { code: number; count: number; data: unknown; msg?: string };

    if (json.code === 302 || json.msg?.toLowerCase().includes('login'))
      throw new Error('Session expired (code)');
    if (json.code === 2) return { data: [], count: 0 };
    if (json.code !== 0 && json.code !== 1)
      throw new Error(`Upstream error code=${json.code}: ${json.msg}`);

    const data = Array.isArray(json.data) ? (json.data as Record<string, unknown>[]) : [];
    return { data, count: json.count ?? 0 };
  } finally {
    clearTimeout(timer);
  }
}

// ── Fetch toàn bộ (tự phân trang nếu upstream cap 9999) ────────────────────
async function fetchReport(path: string, cookie: string): Promise<Record<string, unknown>[]> {
  const first = await fetchPage(path, cookie, 1);
  const all   = [...first.data];
  const total = first.count;

  if (total > MAX_PER_PAGE) {
    const pages = Math.ceil(total / MAX_PER_PAGE);
    console.log(`    (upstream có ${total.toLocaleString()} bản ghi → ${pages} trang)`);
    // fetch song song các trang còn lại
    const rest = await Promise.all(
      Array.from({ length: pages - 1 }, (_, i) =>
        fetchPage(path, cookie, i + 2).then(r => r.data),
      ),
    );
    for (const rows of rest) all.push(...rows);
  }

  return all;
}

// ── Cộng dồn theo username ──────────────────────────────────────────────────
function toNum(v: unknown): number {
  const n = parseFloat(String(v ?? ''));
  return isNaN(n) ? 0 : n;
}

function aggregate(
  rows: Record<string, unknown>[],
  groupKeys: string[],
  sumFields: string[],
  keepFirst: string[],
): Record<string, unknown>[] {
  const map = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    const key = groupKeys.map(k => String(row[k] ?? '')).join('\x00');
    if (!map.has(key)) {
      const e: Record<string, unknown> = {};
      for (const k of groupKeys) e[k] = row[k] ?? '';
      for (const k of keepFirst)  e[k] = row[k] ?? '';
      for (const k of sumFields)  e[k] = 0;
      map.set(key, e);
    }
    const e = map.get(key)!;
    for (const k of sumFields) (e[k] as number) += toNum(row[k]);
  }
  const out = [...map.values()];
  for (const row of out)
    for (const k of sumFields)
      row[k] = Math.round((row[k] as number) * 10000) / 10000;
  out.sort((a, b) => String(a.username ?? '').localeCompare(String(b.username ?? '')));
  return out;
}

// ── Build XLSX ──────────────────────────────────────────────────────────────
function buildSheet(rows: Record<string, unknown>[], headers: Record<string, string>): XLSX.WorkSheet {
  if (!rows.length) return XLSX.utils.aoa_to_sheet([['(Không có dữ liệu)']]);
  const cols = Object.keys(headers);
  const hdr  = cols.map(c => headers[c]);
  const data = rows.map(r => cols.map(c => r[c] ?? ''));
  const ws   = XLSX.utils.aoa_to_sheet([hdr, ...data]);
  ws['!cols'] = cols.map((c, i) => ({
    wch: Math.max(hdr[i].length, ...data.map(r => String(r[i] ?? '').length), 10) + 2,
  }));
  return ws;
}

function save(ws: XLSX.WorkSheet, sheet: string, file: string, n: number) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet);
  XLSX.writeFile(wb, file);
  console.log(`  ✅ ${file}  (${n.toLocaleString()} dòng)`);
}

// ── Headers (có cột Nhân viên để phân biệt đại lý) ──────────────────────────
const LOTTERY_HEADERS: Record<string, string> = {
  agent_name:         'Nhân viên',
  username:           'Tên tài khoản',
  user_parent_format: 'Thuộc đại lý',
  lottery_name:       'Tên loại xổ',
  bet_count:          'Số lần cược',
  bet_amount:         'Tiền cược',
  valid_amount:       'Tiền cược hợp lệ',
  rebate_amount:      'Hoàn trả',
  result:             'Thắng thua',
  win_lose:           'Kết quả thắng thua',
  prize:              'Tiền trúng',
};

const THIRD_HEADERS: Record<string, string> = {
  agent_name:       'Nhân viên',
  username:         'Tên tài khoản',
  platform_id_name: 'Nhà cung cấp game',
  t_bet_times:      'Số lần cược',
  t_bet_amount:     'Tiền cược',
  t_turnover:       'Tiền cược hợp lệ',
  t_prize:          'Tiền thưởng',
  t_win_lose:       'Thắng thua',
};

const FUNDS_HEADERS: Record<string, string> = {
  agent_name:            'Nhân viên',
  username:              'Tên tài khoản',
  user_parent_format:    'Thuộc đại lý',
  deposit_count:         'Số lần nạp',
  deposit_amount:        'Số tiền nạp',
  withdrawal_count:      'Số lần rút',
  withdrawal_amount:     'Số tiền rút',
  charge_fee:            'Phí dịch vụ',
  agent_commission:      'Hoa hồng đại lý',
  promotion:             'Ưu đãi',
  third_rebate:          'Hoàn trả bên thứ 3',
  third_activity_amount: 'Tiền thưởng từ bên thứ 3',
};

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n📅 Tháng: ${MONTH_LABEL}  (${DATE_FROM} → ${DATE_TO})\n`);

  // Lấy tất cả active agents từ DB
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const { rows: agentRows } = await pool.query<{ name: string; session_cookie: string }>(
    `SELECT name, session_cookie FROM agents WHERE is_active = true AND status = 'active' ORDER BY name`,
  );
  await pool.end();

  if (!agentRows.length) { console.error('❌ Không có agent nào active!'); process.exit(1); }

  const agents = agentRows.map(a => ({ name: a.name, cookie: decryptCookie(a.session_cookie) }));
  console.log(`👥 ${agents.length} agent: ${agents.map(a => a.name).join(', ')}\n`);

  // Accumulate tất cả dữ liệu từ tất cả agent
  const allLottery: Record<string, unknown>[] = [];
  const allThird:   Record<string, unknown>[] = [];
  const allFunds:   Record<string, unknown>[] = [];

  // Tuần tự từng agent (tránh 504 khi nhiều request cùng lúc)
  for (let i = 0; i < agents.length; i++) {
    const a = agents[i];
    console.log(`\n🔑 [${i + 1}/${agents.length}] ${a.name}`);

    // 3 request cho agent này
    try {
      const lottery = await fetchReport('/agent/reportLottery.html', a.cookie);
      console.log(`   Xổ số    : ${lottery.length.toLocaleString()} bản ghi`);
      allLottery.push(...lottery.map(r => ({ agent_name: a.name, ...r })));
    } catch (e) { console.warn(`   ⚠️  Xổ số lỗi: ${e instanceof Error ? e.message : e}`); }

    try {
      const third = await fetchReport('/agent/reportThirdGame.html', a.cookie);
      console.log(`   Nhà CC   : ${third.length.toLocaleString()} bản ghi`);
      allThird.push(...third.map(r => ({ agent_name: a.name, ...r })));
    } catch (e) { console.warn(`   ⚠️  Nhà CC lỗi: ${e instanceof Error ? e.message : e}`); }

    try {
      const funds = await fetchReport('/agent/reportFunds.html', a.cookie);
      console.log(`   Giao dịch: ${funds.length.toLocaleString()} bản ghi`);
      allFunds.push(...funds.map(r => ({ agent_name: a.name, ...r })));
    } catch (e) { console.warn(`   ⚠️  Giao dịch lỗi: ${e instanceof Error ? e.message : e}`); }
  }

  // Cộng dồn theo nhân viên + username
  const lottery = aggregate(
    allLottery,
    ['agent_name', 'username', 'lottery_name'],
    ['bet_count', 'bet_amount', 'valid_amount', 'rebate_amount', 'result', 'win_lose', 'prize'],
    ['user_parent_format'],
  );
  const third = aggregate(
    allThird,
    ['agent_name', 'username', 'platform_id_name'],
    ['t_bet_times', 't_bet_amount', 't_turnover', 't_prize', 't_win_lose'],
    [],
  );
  const funds = aggregate(
    allFunds,
    ['agent_name', 'username'],
    ['deposit_count', 'deposit_amount', 'withdrawal_count', 'withdrawal_amount',
     'charge_fee', 'agent_commission', 'promotion', 'third_rebate', 'third_activity_amount'],
    ['user_parent_format'],
  );

  console.log(`\n📈 Tổng hợp:`);
  console.log(`   Xổ số    : ${allLottery.length.toLocaleString()} → ${lottery.length.toLocaleString()} dòng`);
  console.log(`   Nhà CC   : ${allThird.length.toLocaleString()} → ${third.length.toLocaleString()} dòng`);
  console.log(`   Giao dịch: ${allFunds.length.toLocaleString()} → ${funds.length.toLocaleString()} dòng\n`);

  console.log(`📝 Xuất file...`);
  save(buildSheet(lottery, LOTTERY_HEADERS), 'Báo Cáo XS',     `bc-xs-${MONTH_LABEL}.xlsx`,            lottery.length);
  save(buildSheet(third,   THIRD_HEADERS),   'Báo Cáo Nhà CC', `bc-nha-cc-${MONTH_LABEL}.xlsx`,        third.length);
  save(buildSheet(funds,   FUNDS_HEADERS),   'Sao Kê GD',      `sao-ke-giao-dich-${MONTH_LABEL}.xlsx`, funds.length);

  console.log(`\n✅ Hoàn tất! 3 file xlsx tại BACKEND/\n`);
}

main().catch(err => { console.error('❌', err instanceof Error ? err.message : err); process.exit(1); });
