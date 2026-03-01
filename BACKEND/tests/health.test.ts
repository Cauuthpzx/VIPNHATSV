import { describe, it, expect, vi } from "vitest";
import Fastify from "fastify";
import { healthRoutes } from "../src/health/index.js";

function buildTestApp() {
  const app = Fastify({ logger: false });

  // Mock prisma and redis decorators
  app.decorate("prisma", {
    $queryRaw: vi.fn(),
  });
  app.decorate("redis", {
    ping: vi.fn(),
  });

  app.register(healthRoutes);

  return app;
}

describe("GET /health", () => {
  it("should return ok with uptime", async () => {
    const app = buildTestApp();

    const res = await app.inject({ method: "GET", url: "/health" });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("ok");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("uptime");
    expect(typeof body.uptime).toBe("number");
  });
});

describe("GET /ready", () => {
  it("should return ready when DB + Redis are healthy", async () => {
    const app = buildTestApp();
    (app as any).prisma.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    (app as any).redis.ping.mockResolvedValue("PONG");

    const res = await app.inject({ method: "GET", url: "/ready" });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("ready");
    expect(body.checks.database).toBe("ok");
    expect(body.checks.redis).toBe("ok");
  });

  it("should return 503 when DB is down", async () => {
    const app = buildTestApp();
    (app as any).prisma.$queryRaw.mockRejectedValue(
      new Error("Connection refused"),
    );
    (app as any).redis.ping.mockResolvedValue("PONG");

    const res = await app.inject({ method: "GET", url: "/ready" });

    expect(res.statusCode).toBe(503);
    const body = res.json();
    expect(body.status).toBe("not_ready");
    expect(body.checks.database).toBe("fail");
    expect(body.checks.redis).toBe("ok");
  });

  it("should return 503 when Redis is down", async () => {
    const app = buildTestApp();
    (app as any).prisma.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    (app as any).redis.ping.mockRejectedValue(new Error("ECONNREFUSED"));

    const res = await app.inject({ method: "GET", url: "/ready" });

    expect(res.statusCode).toBe(503);
    const body = res.json();
    expect(body.status).toBe("not_ready");
    expect(body.checks.database).toBe("ok");
    expect(body.checks.redis).toBe("fail");
  });

  it("should return 503 when both are down", async () => {
    const app = buildTestApp();
    (app as any).prisma.$queryRaw.mockRejectedValue(new Error("DB down"));
    (app as any).redis.ping.mockRejectedValue(new Error("Redis down"));

    const res = await app.inject({ method: "GET", url: "/ready" });

    expect(res.statusCode).toBe(503);
    const body = res.json();
    expect(body.status).toBe("not_ready");
    expect(body.checks.database).toBe("fail");
    expect(body.checks.redis).toBe("fail");
  });
});
