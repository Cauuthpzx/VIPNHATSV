const Redis = require('ioredis');
const redis = new Redis();
(async () => {
  for (const table of ['proxyReportLottery', 'proxyReportFunds', 'proxyReportThirdGame']) {
    const keys = await redis.keys(`sync:date_done:${table}:*`);
    console.log(table + ': ' + keys.length + ' Redis markers');
    if (keys.length > 0 && keys.length <= 5) {
      console.log('  Keys:', keys);
    }
  }
  redis.disconnect();
})();
