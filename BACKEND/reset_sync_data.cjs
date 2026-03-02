/**
 * Reset toàn bộ dữ liệu đồng bộ về 0
 * GIỮ NGUYÊN: users, roles, refresh_tokens, agents (tài khoản + cookies)
 * XOÁ SẠCH: proxy_*, notifications, sync_date_locks, Redis sync markers
 */
const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');
const p = new PrismaClient();
const redis = new Redis();

const TABLES_TO_TRUNCATE = [
  'proxy_users',
  'proxy_invites',
  'proxy_deposits',
  'proxy_withdrawals',
  'proxy_bets',
  'proxy_bet_orders',
  'proxy_report_lottery',
  'proxy_report_funds',
  'proxy_report_third_game',
  'proxy_banks',
  'sync_date_locks',
  'notifications',
];

(async () => {
  console.log('=== RESET DỮ LIỆU ĐỒNG BỘ ===\n');

  // 1. Truncate all proxy/sync tables
  for (const t of TABLES_TO_TRUNCATE) {
    try {
      const count = await p.$executeRawUnsafe(`SELECT COUNT(*) FROM "${t}"`);
      await p.$executeRawUnsafe(`TRUNCATE TABLE "${t}" CASCADE`);
      console.log(`  ✓ ${t} — đã xoá`);
    } catch (e) {
      console.log(`  ✗ ${t} — lỗi: ${e.message}`);
    }
  }

  // 2. Clear all Redis sync markers + cache
  const patterns = ['sync:*', 'proxy:cache:*'];
  let totalRedisKeys = 0;
  for (const pattern of patterns) {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      totalRedisKeys += keys.length;
      console.log(`  ✓ Redis "${pattern}" — ${keys.length} keys đã xoá`);
    } else {
      console.log(`  ✓ Redis "${pattern}" — không có key nào`);
    }
  }

  console.log(`\n=== HOÀN TẤT ===`);
  console.log(`  Bảng đã xoá: ${TABLES_TO_TRUNCATE.length}`);
  console.log(`  Redis keys đã xoá: ${totalRedisKeys}`);
  console.log(`  Giữ nguyên: users, roles, agents (cookies)\n`);

  await p.$disconnect();
  redis.disconnect();
})();
