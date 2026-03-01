import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const agents = [
  { name: "DUY - 黄辉", extUsername: "huangxie09", sessionCookie: "enc:f66b796dc86c1656c4779f76:2430e9e099aacfdb8f4cd83fb20f5ef6:f90c2a3e84a1a61799fbefa62e1646f5e32b69ba35169bed12c4", cookieExpires: "2026-03-01T02:56:15.416Z", lastLoginAt: "2026-02-28T02:56:15.416Z" },
  { name: "NGÂN - 小米", extUsername: "huangxie13", sessionCookie: "enc:92309304f497f046647970a2:bfcc4e289a11557bccb364df4e51ea5a:f806e576bb7da02435f8b2015dc71604a6d5a0a959706565f5ea", cookieExpires: "2026-03-01T02:56:34.305Z", lastLoginAt: "2026-02-28T02:56:34.305Z" },
  { name: "ĐẠT - 啊得", extUsername: "huangxie02", sessionCookie: "enc:9ab1f8dd3bd3ea1292cc71fd:913c0ab2b07e4479ed0fce2dbd1601d2:5befbff45e502bf91808c0dcc86bbb6d9073dba2dbad987b4e17", cookieExpires: "2026-03-01T02:56:04.351Z", lastLoginAt: "2026-02-28T02:56:04.352Z" },
  { name: "HUỲNH - 春花", extUsername: "huangxie10", sessionCookie: "enc:2022f1a5db2b8b9551ae0a75:b91f57c53775921404aed482d4286935:6d267f902acf6901ed51d8db1dd22f308583b533c227d8c4a12c", cookieExpires: "2026-03-01T02:56:20.283Z", lastLoginAt: "2026-02-28T02:56:20.283Z" },
  { name: "CẢNH - 大帽", extUsername: "huangxie08", sessionCookie: "enc:1a555e754aabd71f8227a163:c39ce2566b3517c3a7cc5dcfcde1c62b:5f8ff897bf7a5482306d04227d9235cd728099dc2bb14670a1b9", cookieExpires: "2026-03-01T02:55:46.705Z", lastLoginAt: "2026-02-28T02:55:46.705Z" },
  { name: "112233", extUsername: "112233", sessionCookie: "enc:81c506ec2a4277d539452698:d93e13e4c90d180167bc0a74617ff359:b45036a6221f47dc8be286e5bda0c971c245dd3b57e88d530d77", cookieExpires: "2026-03-01T02:56:24.480Z", lastLoginAt: "2026-02-28T02:56:24.480Z" },
  { name: "TUẤN - 亚索", extUsername: "huangxie06", sessionCookie: "enc:126f3f02d66731ae81acda02:f94bf3583605cb164a3a8c6148be09e2:4b4f2235f9c31f47a13e098c511d3907177d30d5780aeda500d5", cookieExpires: "2026-03-01T02:56:06.144Z", lastLoginAt: "2026-02-28T02:56:06.144Z" },
  { name: "ĐỨC 2 - 更新", extUsername: "huangxie05", sessionCookie: "enc:6846c6d10e8c4d6dee1c51f7:98941566a91f0dbe48f402398dd99391:f6f9629e461ecd2cff402284cc2999c752a0fa15a79c049a8ad0", cookieExpires: "2026-03-01T02:56:00.403Z", lastLoginAt: "2026-02-28T02:56:00.403Z" },
  { name: "TÀI - 楚恒", extUsername: "huangxie07", sessionCookie: "enc:9cf1f9564b7be45c4674f6aa:ec97620ddb3e9f3a46413c65435469dd:1a80ca1b3457d0be8d199ee0701cce4a4a796e14d729ea571ea9", cookieExpires: "2026-03-01T02:55:41.482Z", lastLoginAt: "2026-02-28T02:55:41.482Z" },
  { name: "VŨ - 小面", extUsername: "huangxie01", sessionCookie: "enc:101643e990609b989b2ee93a:87ca5438e300cd18ac5b5c435df393cc:fa8c3442bcd7434bf2927db5ca079b083f1eafaa00a9eea9b16b", cookieExpires: "2026-03-01T02:55:56.244Z", lastLoginAt: "2026-02-28T02:55:56.244Z" },
  { name: "QUANG - 小博", extUsername: "huangxie16", sessionCookie: "enc:f0c090a228ddd828b7c4b3d3:c41eb92fad0860f98e1695ba7891b294:aca27eda8c22dfe0c01506fd8acf9c94888ceff1dff24fbc54da", cookieExpires: "2026-03-01T02:56:10.282Z", lastLoginAt: "2026-02-28T02:56:10.282Z" },
  { name: "THƯ - 爱玉", extUsername: "huangxie15", sessionCookie: "enc:79785a4d021d1d07287585d7:368511601ea6e861424cef944c3b5555:af450da423fa1779c434e7a9034f8f8806bd4cc929b281f36b5c", cookieExpires: "2026-03-01T02:56:28.812Z", lastLoginAt: "2026-02-28T02:56:28.813Z" },
];

async function main() {
  for (const agent of agents) {
    await prisma.agent.upsert({
      where: { extUsername: agent.extUsername },
      create: {
        name: agent.name,
        extUsername: agent.extUsername,
        sessionCookie: agent.sessionCookie,
        cookieExpires: agent.cookieExpires ? new Date(agent.cookieExpires) : null,
        status: "active",
        isActive: true,
        lastLoginAt: agent.lastLoginAt ? new Date(agent.lastLoginAt) : null,
      },
      update: {
        name: agent.name,
        sessionCookie: agent.sessionCookie,
        cookieExpires: agent.cookieExpires ? new Date(agent.cookieExpires) : null,
        status: "active",
        isActive: true,
        lastLoginAt: agent.lastLoginAt ? new Date(agent.lastLoginAt) : null,
      },
    });
  }
  console.log(`Seeded ${agents.length} agents`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
