const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const locks = await p.$queryRawUnsafe(`
    SELECT table_name, count(*)::int as c, min(sync_date) as min_date, max(sync_date) as max_date
    FROM sync_date_locks 
    GROUP BY table_name 
    ORDER BY table_name
  `);
  console.log('SyncDateLocks:');
  for (const row of locks) {
    console.log(`  ${row.table_name}: ${row.c} entries (${row.min_date} → ${row.max_date})`);
  }
  await p.$disconnect();
})();
