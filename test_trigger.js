const http = require('http');
function post(path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body || {});
    const opts = { hostname: 'localhost', port: 3000, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers, 'Content-Length': Buffer.byteLength(data) } };
    const req = http.request(opts, res => { let c = []; res.on('data', d => c.push(d)); res.on('end', () => resolve(JSON.parse(Buffer.concat(c).toString()))); });
    req.on('error', reject); req.write(data); req.end();
  });
}
async function main() {
  const login = await post('/api/v1/auth/login', { username: 'admin', password: 'admin123' });
  const token = login.data.accessToken;
  const res = await post('/api/v1/sync/trigger', {}, { Authorization: 'Bearer ' + token });
  console.log('Trigger result:', JSON.stringify(res));
}
main().catch(e => console.error(e));
