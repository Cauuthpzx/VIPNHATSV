import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async (_request, reply) => {
    return reply.send({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.get("/ready", async (_request, reply) => {
    const checks: Record<string, "ok" | "fail"> = {};

    // Database check
    try {
      await app.prisma.$queryRaw`SELECT 1`;
      checks.database = "ok";
    } catch {
      checks.database = "fail";
    }

    // Redis check
    try {
      await app.redis.ping();
      checks.redis = "ok";
    } catch {
      checks.redis = "fail";
    }

    const allOk = Object.values(checks).every((v) => v === "ok");
    const statusCode = allOk ? 200 : 503;

    return reply.status(statusCode).send({
      status: allOk ? "ready" : "not_ready",
      checks,
      timestamp: new Date().toISOString(),
    });
  });
}
