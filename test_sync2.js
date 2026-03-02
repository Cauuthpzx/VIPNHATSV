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

  // Check full response structure
  const rf = await post('/api/v1/proxy/reportFunds', { date: '2026-01-01 - 2026-01-01', page: 1, limit: 10 }, auth);
  console.log('reportFunds full response:', JSON.stringify(rf).slice(0, 500));

  const rl = await post('/api/v1/proxy/reportLottery', { date: '2026-01-01 - 2026-01-01', page: 1, limit: 10 }, auth);
  console.log('reportLottery full response:', JSON.stringify(rl).slice(0, 500));
}
main().catch(e => console.error(e));
