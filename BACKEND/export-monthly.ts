/**
 * Xuất báo cáo tháng từ DB MAXHUB ra 3 file XLSX với tên cột tiếng Việt.
 * Usage: npx tsx export-monthly.ts [--month=YYYY-MM]
 * Mặc định: tháng trước.
 * Output:
 *   bc-xs-YYYY-MM.xlsx
 *   bc-nha-cc-YYYY-MM.xlsx
 *   sao-ke-giao-dich-YYYY-MM.xlsx
 */
import pg from 'pg';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

// ── Date range ──────────────────────────────────────────────
const monthArg = process.argv.find(a => a.startsWith('--month='))?.split('=')[1];
const target    = monthArg ? dayjs(`${monthArg}-01`) : dayjs().subtract(1, 'month').startOf('month');
const DATE_FROM  = target.startOf('month').format('YYYY-MM-DD');
const DATE_TO    = target.endOf('month').format('YYYY-MM-DD');
const MONTH_LABEL = target.format('YYYY-MM');

const DB = 'postgresql://postgres:hiepmun2021@localhost:5432/fastify_skeleton';
const pool = new pg.Pool({ connectionString: DB });

// ── Column headers ──────────────────────────────────────────

const LOTTERY_HEADERS: Record<string, string> = {
  username:           'Tên tài khoản',
  user_parent_format: 'Thuộc đại lý',
  lottery_name:       'Tên loại xổ',
  bet_count:          'Số lần cược',
  bet_amount:         'Tiền cược',
  valid_amount:       'Tiền cược hợp lệ (trừ cược hoà)',
  rebate_amount:      'Hoàn trả',
  result:             'Thắng thua',
  win_lose:           'Kết quả thắng thua (không gồm hoàn trả)',
  prize:              'Tiền trúng',
};

const THIRD_HEADERS: Record<string, string> = {
  username:         'Tên tài khoản',
  platform_id_name: 'Nhà cung cấp game',
  t_bet_times:      'Số lần cược',
  t_bet_amount:     'Tiền cược',
  t_turnover:       'Tiền cược hợp lệ',
  t_prize:          'Tiền thưởng',
  t_win_lose:       'Thắng thua',
};

const FUNDS_HEADERS: Record<string, string> = {
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

// ── Build worksheet ─────────────────────────────────────────

function buildSheet(rows: Record<string, unknown>[], headers: Record<string, string>): XLSX.WorkSheet {
  if (!rows.length) return XLSX.utils.aoa_to_sheet([['(Không có dữ liệu)']]);

  const cols = Object.keys(headers);
  const headerRow = cols.map(c => headers[c]);
  const dataRows  = rows.map(r => cols.map(c => {
    const v = r[c];
    return v === null || v === undefined ? '' : v;
  }));

  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

  // Auto column width
  const colWidths = cols.map((c, i) => {
    const header = headerRow[i].length;
    const maxData = Math.max(...dataRows.map(r => String(r[i] ?? '').length));
    return { wch: Math.max(header, maxData, 10) + 2 };
  });
  ws['!cols'] = colWidths;

  return ws;
}

function saveFile(ws: XLSX.WorkSheet, sheetName: string, filename: string, count: number) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
  console.log(`  ✅ ${filename}  (${count.toLocaleString()} dòng)`);
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  console.log(`\n📅 Tháng: ${MONTH_LABEL}  (${DATE_FROM} → ${DATE_TO})\n`);

  // 1. Báo cáo xổ số — cộng dồn theo tên tài khoản khách hàng + loại xổ
  const { rows: lottery } = await pool.query<Record<string, unknown>>(`
    SELECT
      r.username,
      MAX(r.user_parent_format)     AS user_parent_format,
      r.lottery_name,
      SUM(r.bet_count)              AS bet_count,
      SUM(r.bet_amount)             AS bet_amount,
      SUM(r.valid_amount)           AS valid_amount,
      SUM(r.rebate_amount)          AS rebate_amount,
      SUM(r.result)                 AS result,
      SUM(r.win_lose)               AS win_lose,
      SUM(r.prize)                  AS prize
    FROM proxy_report_lottery r
    WHERE r.report_date >= $1 AND r.report_date <= $2
    GROUP BY r.username, r.lottery_name
    ORDER BY r.username, r.lottery_name
  `, [DATE_FROM, DATE_TO]);

  // 2. Báo cáo nhà cung cấp — cộng dồn theo tên tài khoản + nhà cung cấp
  const { rows: third } = await pool.query<Record<string, unknown>>(`
    SELECT
      r.username,
      r.platform_id_name,
      SUM(r.t_bet_times)            AS t_bet_times,
      SUM(r.t_bet_amount)           AS t_bet_amount,
      SUM(r.t_turnover)             AS t_turnover,
      SUM(r.t_prize)                AS t_prize,
      SUM(r.t_win_lose)             AS t_win_lose
    FROM proxy_report_third_game r
    WHERE r.report_date >= $1 AND r.report_date <= $2
    GROUP BY r.username, r.platform_id_name
    ORDER BY r.username, r.platform_id_name
  `, [DATE_FROM, DATE_TO]);

  // 3. Sao kê giao dịch — cộng dồn theo tên tài khoản
  const { rows: funds } = await pool.query<Record<string, unknown>>(`
    SELECT
      r.username,
      MAX(r.user_parent_format)     AS user_parent_format,
      SUM(r.deposit_count)          AS deposit_count,
      SUM(r.deposit_amount)         AS deposit_amount,
      SUM(r.withdrawal_count)       AS withdrawal_count,
      SUM(r.withdrawal_amount)      AS withdrawal_amount,
      SUM(r.charge_fee)             AS charge_fee,
      SUM(r.agent_commission)       AS agent_commission,
      SUM(r.promotion)              AS promotion,
      SUM(r.third_rebate)           AS third_rebate,
      SUM(r.third_activity_amount)  AS third_activity_amount
    FROM proxy_report_funds r
    WHERE r.report_date >= $1 AND r.report_date <= $2
    GROUP BY r.username
    ORDER BY r.username
  `, [DATE_FROM, DATE_TO]);

  console.log(`📊 Kết quả truy vấn:`);
  console.log(`   Báo cáo xổ số       : ${lottery.length.toLocaleString()} dòng`);
  console.log(`   Báo cáo nhà cung cấp: ${third.length.toLocaleString()} dòng`);
  console.log(`   Sao kê giao dịch    : ${funds.length.toLocaleString()} dòng`);
  console.log(`\n📝 Đang xuất file...`);

  saveFile(buildSheet(lottery, LOTTERY_HEADERS), 'Báo Cáo XS',       `bc-xs-${MONTH_LABEL}.xlsx`,              lottery.length);
  saveFile(buildSheet(third,   THIRD_HEADERS),   'Báo Cáo Nhà CC',   `bc-nha-cc-${MONTH_LABEL}.xlsx`,          third.length);
  saveFile(buildSheet(funds,   FUNDS_HEADERS),   'Sao Kê GD',        `sao-ke-giao-dich-${MONTH_LABEL}.xlsx`,   funds.length);

  const total = lottery.length + third.length + funds.length;
  console.log(`\n✅ Hoàn tất! Tổng ${total.toLocaleString()} dòng → 3 file\n`);

  await pool.end();
}

main().catch(err => { console.error('❌', err); process.exit(1); });
