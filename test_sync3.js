const http = require('http');

function post(path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const opts = {
      hostname: 'localhost', port: 3000, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers, 'Content-Length': Buffer.byteLength(data) }
    };
    const req = http.request(opts, res => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString())));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const login = await post('/api/v1/auth/login', { username: 'admin', password: 'admin123' });
  const token = login.data.accessToken;
  const auth = { Authorization: 'Bearer ' + token };

  // reportFunds (proxy splits "date" into start_date/end_date for upstream)
  const rf = await post('/api/v1/proxy/report-funds', { date: '2026-01-01 - 2026-01-01', page: 1, limit: 10 }, auth);
  console.log('report-funds: total=' + rf.data?.total + ', items=' + (Array.isArray(rf.data?.items) ? rf.data.items.length : typeof rf.data?.items));

  // reportLottery
  const rl = await post('/api/v1/proxy/report-lottery', { date: '2026-01-01 - 2026-01-01', page: 1, limit: 10 }, auth);
  console.log('report-lottery: total=' + rl.data?.total + ', items=' + (Array.isArray(rl.data?.items) ? rl.data.items.length : typeof rl.data?.items));

  // betOrder
  const bo = await post('/api/v1/proxy/bet-order', { bet_time: '2026-01-01 - 2026-01-01', page: 1, limit: 10 }, auth);
  console.log('bet-order: total=' + bo.data?.total + ', items=' + (Array.isArray(bo.data?.items) ? bo.data.items.length : typeof bo.data?.items));

  // reportThirdGame
  const rtg = await post('/api/v1/proxy/report-third-game', { date: '2026-01-01 - 2026-01-01', page: 1, limit: 10 }, auth);
  console.log('report-third-game: total=' + rtg.data?.total + ', items=' + (Array.isArray(rtg.data?.items) ? rtg.data.items.length : typeof rtg.data?.items));
}
main().catch(e => console.error(e));
