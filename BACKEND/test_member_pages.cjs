/**
 * Test: Gọi upstream member API xem 1 agent có bao nhiêu trang
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const p = new PrismaClient();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '8776e08b467ce91533905204397b4ee03139f883ca65fc20394f00dcc2ae4f7f';
const BASE_URL = process.env.UPSTREAM_BASE_URL || 'https://a2u4k.ee88dly.com';

function decrypt(encrypted) {
  if (!encrypted || !encrypted.startsWith('enc:')) return encrypted;
  const [, iv, authTag, ciphertext] = encrypted.split(':');
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(iv, 'hex'),
  );
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function testMemberPages() {
  const agents = await p.agent.findMany({
    where: { isActive: true, status: 'active', extUsername: '112233' },
    select: { id: true, name: true, sessionCookie: true, extUsername: true },
  });

  console.log(`Found ${agents.length} active agents\n`);

  const PAGE_SIZE = 5000;

  for (const agent of agents) {
    const cookie = decrypt(agent.sessionCookie);

    const params = new URLSearchParams({ page: '1', limit: String(PAGE_SIZE) });
    const url = `${BASE_URL}/agent/user.html`;

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
        body: params.toString(),
      });

      const json = await res.json();
      const count = json.count || 0;
      const dataLen = Array.isArray(json.data) ? json.data.length : 0;
      const totalPages = Math.ceil(count / PAGE_SIZE);

      console.log(`${agent.name}: count=${count}, page1_items=${dataLen}, total_pages=${totalPages}`);
    } catch (err) {
      console.log(`${agent.name}: ERROR — ${err.message}`);
    }
  }

  await p.$disconnect();
}

testMemberPages();
