const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const r = await p.$queryRawUnsafe(`
    SELECT sync_date, count(*)::int as c 
    FROM proxy_bet_orders 
    GROUP BY sync_date 
    ORDER BY sync_date 
    LIMIT 20
  `);
  console.log('BetOrder by sync_date:');
  for (const row of r) console.log('  ' + row.sync_date + ': ' + row.c);
  console.log('Total rows:', r.reduce((s, x) => s + x.c, 0));
  await p.$disconnect();
})();
