const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  for (const t of ['proxy_bet_orders','proxy_report_lottery','proxy_report_funds','proxy_report_third_game']) {
    const r = await p.$queryRawUnsafe(`SELECT count(*)::int as c FROM "${t}"`);
    console.log(t + ': ' + r[0].c);
  }
  await p.$disconnect();
})();
