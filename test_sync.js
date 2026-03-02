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
  // Login
  const login = await post('/api/v1/auth/login', { username: 'admin', password: 'admin123' });
  const token = login.data.accessToken;
  console.log('Token OK');

  const auth = { Authorization: 'Bearer ' + token };

  // Test reportFunds with date (proxy splits to start_date/end_date for upstream)
  const rf = await post('/api/v1/proxy/reportFunds', { date: '2026-01-01 - 2026-01-01', page: 1, limit: 10 }, auth);
  console.log('reportFunds:', 'total=' + rf.data?.total, 'items=' + rf.data?.items?.length);

  // Test reportLottery
  const rl = await post('/api/v1/proxy/reportLottery', { date: '2026-01-01 - 2026-01-01', page: 1, limit: 10 }, auth);
  console.log('reportLottery:', 'total=' + rl.data?.total, 'items=' + rl.data?.items?.length);

  // Test betOrder
  const bo = await post('/api/v1/proxy/betOrder', { bet_time: '2026-01-01 - 2026-01-01', page: 1, limit: 10 }, auth);
  console.log('betOrder:', 'total=' + bo.data?.total, 'items=' + bo.data?.items?.length);

  // Test reportThirdGame
  const rtg = await post('/api/v1/proxy/reportThirdGame', { date: '2026-01-01 - 2026-01-01', page: 1, limit: 10 }, auth);
  console.log('reportThirdGame:', 'total=' + rtg.data?.total, 'items=' + rtg.data?.items?.length);
}
main().catch(e => console.error(e));
