/**
 * Update local agent cookies from remote server data.
 * Usage: node scripts/update_local_cookies.cjs
 */
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

async function main() {
  const prisma = new PrismaClient();

  const cookiesFile = path.join(__dirname, "remote_cookies.json");
  if (!fs.existsSync(cookiesFile)) {
    console.error("File not found:", cookiesFile);
    process.exit(1);
  }

  const remoteCookies = JSON.parse(fs.readFileSync(cookiesFile, "utf-8"));
  console.log(`Loaded ${remoteCookies.length} agents from remote_cookies.json\n`);

  // Get all local agents
  const localAgents = await prisma.agent.findMany({
    select: { id: true, name: true, sessionCookie: true, cookieExpires: true, status: true },
  });
  console.log(`Local agents: ${localAgents.length}\n`);

  let updated = 0;
  let skipped = 0;

  for (const remote of remoteCookies) {
    // Match by name — normalize separator (remote uses " - ", local uses " ")
    const normalize = (n) => n.replace(/\s*-\s*/g, " ").trim();
    const remoteName = normalize(remote.name);
    const local = localAgents.find((a) => normalize(a.name) === remoteName);
    if (!local) {
      console.log(`  SKIP: "${remote.name}" not found locally`);
      skipped++;
      continue;
    }

    const newExpires = new Date(remote.cookie_expires);
    const oldExpires = local.cookieExpires;

    // Update if remote cookie is newer or local is expired
    const shouldUpdate =
      !oldExpires || newExpires > oldExpires || oldExpires < new Date();

    if (shouldUpdate) {
      await prisma.agent.update({
        where: { id: local.id },
        data: {
          sessionCookie: remote.session_cookie,
          cookieExpires: newExpires,
          status: "active",
        },
      });
      console.log(
        `  UPDATED: ${remote.name} | expires: ${newExpires.toISOString()} | was: ${oldExpires ? oldExpires.toISOString() : "null"}`
      );
      updated++;
    } else {
      console.log(`  OK: ${remote.name} (local cookie still valid)`);
      skipped++;
    }
  }

  console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
