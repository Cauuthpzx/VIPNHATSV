/**
 * Benchmark: So sánh tốc độ upsert member vào DB
 * 1. Prisma upsert từng row (batch 100 trong tx) — cách hiện tại
 * 2. Raw SQL INSERT ... ON CONFLICT (bulk 1000 rows/query)
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

function str(val) { return val != null && val !== '' ? String(val) : null; }
function dec(val) { if (val == null || val === '') return null; const n = Number(val); return isNaN(n) ? null : n; }
function int(val) { if (val == null || val === '') return 0; const n = parseInt(String(val), 10); return isNaN(n) ? 0 : n; }

async function fetchMembers(cookie, limit) {
  const res = await fetch(`${BASE_URL}/agent/user.html`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': `PHPSESSID=${cookie}`,
      'User-Agent': 'Mozilla/5.0',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': BASE_URL,
      'Origin': BASE_URL,
    },
    body: new URLSearchParams({ page: '1', limit: String(limit) }).toString(),
  });
  const json = await res.json();
  return Array.isArray(json.data) ? json.data : [];
}

async function benchmarkRawBulk(agentId, items, batchSize) {
  const start = Date.now();
  const now = new Date().toISOString();
  let total = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const values = [];
    const params = [];
    let paramIdx = 1;

    for (const item of batch) {
      const username = str(item.username);
      if (!username) continue;

      values.push(`($${paramIdx}, $${paramIdx+1}, $${paramIdx+2}, $${paramIdx+3}, $${paramIdx+4}, $${paramIdx+5}, $${paramIdx+6}, $${paramIdx+7}, $${paramIdx+8}, $${paramIdx+9}, $${paramIdx+10}, $${paramIdx+11}, $${paramIdx+12}, $${paramIdx+13}::timestamp)`);
      params.push(
        crypto.randomUUID(),              // 0: id
        agentId,                          // 1
        username,                          // 2
        str(item.type_format),            // 3
        str(item.parent_user),            // 4
        dec(item.money),                  // 5
        int(item.deposit_count),          // 6
        int(item.withdrawal_count),       // 7
        dec(item.deposit_amount),         // 8
        dec(item.withdrawal_amount),      // 9
        str(item.login_time),            // 10
        str(item.register_time),         // 11
        str(item.status_format),         // 12
        now,                             // 13: synced_at
      );
      paramIdx += 14;
    }

    if (values.length === 0) continue;

    const sql = `
      INSERT INTO proxy_users (id, agent_id, username, type_format, parent_user, money, deposit_count, withdrawal_count, deposit_amount, withdrawal_amount, login_time, register_time, status_format, synced_at)
      VALUES ${values.join(', ')}
      ON CONFLICT (agent_id, username)
      DO UPDATE SET
        type_format = EXCLUDED.type_format,
        parent_user = EXCLUDED.parent_user,
        money = EXCLUDED.money,
        deposit_count = EXCLUDED.deposit_count,
        withdrawal_count = EXCLUDED.withdrawal_count,
        deposit_amount = EXCLUDED.deposit_amount,
        withdrawal_amount = EXCLUDED.withdrawal_amount,
        login_time = EXCLUDED.login_time,
        register_time = EXCLUDED.register_time,
        status_format = EXCLUDED.status_format,
        synced_at = EXCLUDED.synced_at
    `;

    const result = await p.$executeRawUnsafe(sql, ...params);
    total += batch.length;
  }

  return { total, elapsed: Date.now() - start };
}

async function main() {
  const agent = await p.agent.findFirst({
    where: { isActive: true, status: 'active', extUsername: '112233' },
  });
  if (!agent) { console.log('Agent not found'); return; }

  const cookie = decrypt(agent.sessionCookie);

  // Fetch 20k members
  console.log('Fetching 20k members...');
  const fetchStart = Date.now();
  const items = await fetchMembers(cookie, 20000);
  console.log(`Fetched ${items.length} items in ${Date.now() - fetchStart}ms\n`);

  // Clear trước khi test
  await p.$executeRawUnsafe('TRUNCATE TABLE proxy_users CASCADE');

  // Test 1: Raw bulk INSERT ON CONFLICT — batch 1000
  console.log('--- Raw SQL bulk (batch 1000) ---');
  const r1 = await benchmarkRawBulk(agent.id, items, 1000);
  console.log(`  ${r1.total} rows in ${r1.elapsed}ms`);

  // Clear lại
  await p.$executeRawUnsafe('TRUNCATE TABLE proxy_users CASCADE');

  // Test 2: Raw bulk INSERT ON CONFLICT — batch 5000
  console.log('--- Raw SQL bulk (batch 5000) ---');
  const r2 = await benchmarkRawBulk(agent.id, items, 5000);
  console.log(`  ${r2.total} rows in ${r2.elapsed}ms`);

  // Clear lại
  await p.$executeRawUnsafe('TRUNCATE TABLE proxy_users CASCADE');

  await p.$disconnect();
}

main().catch(console.error);
