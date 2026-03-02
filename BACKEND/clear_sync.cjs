const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');
const p = new PrismaClient();
const redis = new Redis();

(async () => {
  // Clear DB sync date locks
  try {
    const deleted = await p.$executeRawUnsafe('DELETE FROM sync_date_locks');
    console.log('DB sync_date_locks cleared:', deleted, 'rows');
  } catch (e) {
    console.log('DB sync_date_locks clear error:', e.message);
  }

  // Truncate report + betOrder tables (re-sync with correct params)
  const tables = ['proxy_report_lottery', 'proxy_report_funds', 'proxy_report_third_game'];
  for (const t of tables) {
    await p.$executeRawUnsafe(`TRUNCATE TABLE "${t}" CASCADE`);
    console.log('Truncated:', t);
  }

  // Clear all Redis sync markers
  const dateKeys = await redis.keys('sync:date_done:*');
  const onceKeys = await redis.keys('sync:once_done:*');
  const allKeys = [...dateKeys, ...onceKeys];
  if (allKeys.length > 0) {
    await redis.del(...allKeys);
  }
  console.log('Redis markers cleared:', allKeys.length);

  await p.$disconnect();
  redis.disconnect();
})();
