/**
 * Test: Gọi upstream member API với limit rất lớn để lấy hết 1 lần
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const p = new PrismaClient();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '8776e08b467ce91533905204397b4ee03139f883ca65fc20394f00dcc2ae4f7f';
const BASE_URL = process.env.UPSTREAM_BASE_URL || 'https://a2u4k.ee88dly.com';

function decrypt(encrypted) {
  if (!encrypted || !encrypted.startsWith('enc:')) return encrypted;
  const [, iv, authTag, ciphertext] = encrypted.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function test() {
  const agent = await p.agent.findFirst({
    where: { isActive: true, status: 'active', extUsername: '112233' },
  });
  if (!agent) { console.log('Agent not found'); return; }

  const cookie = decrypt(agent.sessionCookie);
  const url = `${BASE_URL}/agent/user.html`;

  // Test với limit = 100000 (lấy hết 1 lần)
  const LIMITS = [10000, 50000, 100000];

  for (const limit of LIMITS) {
    const start = Date.now();
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': `PHPSESSID=${cookie}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': BASE_URL,
          'Origin': BASE_URL,
        },
        body: new URLSearchParams({ page: '1', limit: String(limit) }).toString(),
      });

      const json = await res.json();
      const dataLen = Array.isArray(json.data) ? json.data.length : 0;
      const elapsed = Date.now() - start;

      console.log(`limit=${limit}: count=${json.count}, items=${dataLen}, time=${elapsed}ms`);
    } catch (err) {
      console.log(`limit=${limit}: ERROR — ${err.message} (${Date.now() - start}ms)`);
    }
  }

  await p.$disconnect();
}

test();
