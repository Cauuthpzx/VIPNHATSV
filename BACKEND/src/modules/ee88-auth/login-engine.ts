import type { FastifyInstance } from "fastify";
import { decryptAES, encryptRSA, encryptSessionCookie, decryptSessionCookie } from "../../utils/crypto.js";
import { fetchUpstream } from "../proxy/proxy.client.js";
import { AppError } from "../../errors/AppError.js";
import { HTTP_STATUS } from "../../constants/http.js";
import { ERROR_CODES } from "../../constants/error-codes.js";
import { appConfig } from "../../config/app.js";
import { logger } from "../../utils/logger.js";
import { solveCaptcha } from "./captcha-solver.js";

const MAX_CAPTCHA_ATTEMPTS = 10;
const CAPTCHA_RETRY_DELAY_MS = 500;
const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 min auto-release

// Lock per agent with timestamp — auto-release if process crashes
const LOGIN_LOCK = new Map<string, number>();

function acquireLock(agentId: string): boolean {
  const now = Date.now();
  const lockTime = LOGIN_LOCK.get(agentId);
  if (lockTime && now - lockTime < LOCK_TIMEOUT_MS) {
    return false;
  }
  LOGIN_LOCK.set(agentId, now);
  return true;
}

function releaseLock(agentId: string): void {
  LOGIN_LOCK.delete(agentId);
}

interface LoginResult {
  success: boolean;
  captchaAttempts: number;
  errorMessage: string | null;
}

function getBaseUrl(agentBaseUrl: string | null): string {
  return agentBaseUrl || appConfig.upstream.baseUrl;
}

function extractPHPSESSID(setCookieHeader: string | string[] | undefined): string | null {
  if (!setCookieHeader) return null;
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  for (const cookie of cookies) {
    const match = cookie.match(/PHPSESSID=([^;]+)/);
    if (match?.[1]) return match[1];
  }
  return null;
}

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * Raw fetch for login flow — bypass normal proxy client (needs custom headers/binary).
 */
async function fetchRaw(
  url: string,
  options: {
    method?: "GET" | "POST";
    headers?: Record<string, string>;
    body?: string;
    binary?: boolean;
  } = {},
): Promise<{ status: number; headers: Record<string, string | string[]>; text: string; buffer: Buffer }> {
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: options.headers ?? {},
    body: options.body ?? null,
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  const text = options.binary ? "" : buffer.toString("utf-8");

  // Convert headers to plain object
  const headersObj: Record<string, string | string[]> = {};
  response.headers.forEach((value, key) => {
    if (key === "set-cookie") {
      const existing = headersObj[key];
      if (Array.isArray(existing)) {
        existing.push(value);
      } else if (existing) {
        headersObj[key] = [existing as string, value];
      } else {
        headersObj[key] = [value];
      }
    } else {
      headersObj[key] = value;
    }
  });

  return { status: response.status, headers: headersObj, text, buffer };
}

export async function loginAgent(
  app: FastifyInstance,
  agentId: string,
  triggeredBy: string = "manual",
  ipAddress: string | null = null,
): Promise<LoginResult> {
  if (!acquireLock(agentId)) {
    throw new AppError(
      "Agent đang trong quá trình đăng nhập",
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.AGENT_LOCKED,
    );
  }

  let captchaAttempts: number;

  try {
    // Step 1: Load agent and decrypt password
    const agent = await app.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent || !agent.isActive) {
      throw new AppError(
        "Agent không tồn tại hoặc đã bị vô hiệu hoá",
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
      );
    }
    if (!agent.extPassword) {
      throw new AppError(
        "Agent chưa có mật khẩu upstream",
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const password = decryptAES(agent.extPassword);
    const baseUrl = getBaseUrl(agent.baseUrl);

    // Step 2: Set status to logging_in
    await app.prisma.agent.update({
      where: { id: agentId },
      data: { status: "logging_in", loginError: null },
    });

    logger.info({ agentId, username: agent.extUsername }, "Bắt đầu đăng nhập EE88");

    // Step 3: POST /agent/login?scene=init -> get RSA public key
    const initUrl = `${baseUrl}/agent/login?scene=init`;
    const initRes = await fetchRaw(initUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": DEFAULT_USER_AGENT,
      },
    });

    let initData: { code: number; data?: { public_key?: string } };
    try {
      initData = JSON.parse(initRes.text);
    } catch {
      throw new AppError(
        `Phản hồi init không hợp lệ: ${initRes.text.slice(0, 200)}`,
        HTTP_STATUS.BAD_GATEWAY,
        ERROR_CODES.LOGIN_FAILED,
      );
    }

    const publicKey = initData.data?.public_key;
    if (!publicKey) {
      throw new AppError(
        "Không lấy được RSA public key từ EE88",
        HTTP_STATUS.BAD_GATEWAY,
        ERROR_CODES.LOGIN_FAILED,
      );
    }

    // Capture session ID from init
    let sessionId = extractPHPSESSID(initRes.headers["set-cookie"]);

    // Step 4-10: Captcha loop
    for (captchaAttempts = 1; captchaAttempts <= MAX_CAPTCHA_ATTEMPTS; captchaAttempts++) {
      if (captchaAttempts > 1) {
        await sleep(CAPTCHA_RETRY_DELAY_MS);
      }

      // Fetch captcha image (binary)
      const captchaUrl = `${baseUrl}/agent/captcha?t=${Date.now()}`;
      const captchaHeaders: Record<string, string> = { "User-Agent": DEFAULT_USER_AGENT };
      if (sessionId) captchaHeaders["Cookie"] = `PHPSESSID=${sessionId}`;

      const captchaRes = await fetchRaw(captchaUrl, { headers: captchaHeaders, binary: true });

      const newSession = extractPHPSESSID(captchaRes.headers["set-cookie"]);
      if (newSession) sessionId = newSession;

      // OCR solve captcha
      const captchaCode = await solveCaptcha(captchaRes.buffer);
      if (!captchaCode) {
        logger.warn({ agentId, attempt: captchaAttempts }, "OCR thất bại, fetch captcha mới...");
        continue;
      }

      // RSA encrypt password
      const encryptedPassword = encryptRSA(password, publicKey);

      // POST /agent/login with credentials
      const loginUrl = `${baseUrl}/agent/login`;
      const loginBody = [
        `username=${encodeURIComponent(agent.extUsername)}`,
        `password=${encodeURIComponent(encryptedPassword)}`,
        `captcha=${encodeURIComponent(captchaCode)}`,
        "scene=login",
      ].join("&");

      const loginHeaders: Record<string, string> = {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": DEFAULT_USER_AGENT,
      };
      if (sessionId) loginHeaders["Cookie"] = `PHPSESSID=${sessionId}`;

      const loginRes = await fetchRaw(loginUrl, {
        method: "POST",
        headers: loginHeaders,
        body: loginBody,
      });

      const loginSession = extractPHPSESSID(loginRes.headers["set-cookie"]);
      if (loginSession) sessionId = loginSession;

      let loginData: { code: number; msg?: string; url?: string };
      try {
        loginData = JSON.parse(loginRes.text);
      } catch {
        throw new AppError(
          `Phản hồi login không hợp lệ: ${loginRes.text.slice(0, 200)}`,
          HTTP_STATUS.BAD_GATEWAY,
          ERROR_CODES.LOGIN_FAILED,
        );
      }

      const msg = (loginData.msg || "").toLowerCase();

      // Check success
      if (msg.includes("thành công") || msg.includes("success")) {
        const cookieExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

        await app.prisma.agent.update({
          where: { id: agentId },
          data: {
            sessionCookie: encryptSessionCookie(sessionId!),
            cookieExpires,
            status: "active",
            lastLoginAt: new Date(),
            loginError: null,
            loginAttempts: 0,
          },
        });

        await logLoginAttempt(app, agentId, true, captchaAttempts, null, ipAddress, triggeredBy);

        // Invalidate active agents cache + proxy cache for this agent
        try {
          await app.redis.del("cache:active_agents");
        } catch {
          /* ignore */
        }
        try {
          const { invalidateAgentProxyCache } = await import("../proxy/agent.service.js");
          await invalidateAgentProxyCache(app, agentId);
        } catch {
          /* ignore */
        }

        logger.info({ agentId, captchaAttempts }, "Đăng nhập EE88 thành công");
        return { success: true, captchaAttempts, errorMessage: null };
      }

      // Captcha error -> retry
      if (msg.includes("xác nhận") || msg.includes("验证码") || msg.includes("captcha")) {
        logger.warn({ agentId, attempt: captchaAttempts, msg: loginData.msg }, "Captcha sai, thử lại...");
        continue;
      }

      // Password error -> STOP
      if (msg.includes("mật khẩu") || msg.includes("密码") || msg.includes("password")) {
        const errMsg = `Sai mật khẩu: ${loginData.msg}`;
        await setAgentError(app, agentId, errMsg);
        await logLoginAttempt(app, agentId, false, captchaAttempts, errMsg, ipAddress, triggeredBy);
        throw new AppError(errMsg, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.LOGIN_FAILED);
      }

      // Other error -> STOP
      const errMsg = `Lỗi đăng nhập: ${loginData.msg || "Unknown"}`;
      await setAgentError(app, agentId, errMsg);
      await logLoginAttempt(app, agentId, false, captchaAttempts, errMsg, ipAddress, triggeredBy);
      throw new AppError(errMsg, HTTP_STATUS.BAD_GATEWAY, ERROR_CODES.LOGIN_FAILED);
    }

    // Exhausted captcha attempts
    const errMsg = `Không giải được captcha sau ${MAX_CAPTCHA_ATTEMPTS} lần`;
    await setAgentError(app, agentId, errMsg);
    await logLoginAttempt(app, agentId, false, captchaAttempts, errMsg, ipAddress, triggeredBy);
    throw new AppError(errMsg, HTTP_STATUS.BAD_GATEWAY, ERROR_CODES.CAPTCHA_FAILED);
  } finally {
    releaseLock(agentId);
  }
}

export async function logoutAgent(app: FastifyInstance, agentId: string): Promise<void> {
  const agent = await app.prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) throw new AppError("Agent không tồn tại", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);

  const baseUrl = getBaseUrl(agent.baseUrl);

  // Try logout upstream (ignore errors)
  if (agent.sessionCookie) {
    try {
      const cookie = decryptSessionCookie(agent.sessionCookie);
      await fetchRaw(`${baseUrl}/agent/loginOut`, {
        headers: {
          Cookie: `PHPSESSID=${cookie}`,
          "User-Agent": DEFAULT_USER_AGENT,
          "X-Requested-With": "XMLHttpRequest",
        },
      });
    } catch {
      /* ignore */
    }
  }

  await app.prisma.agent.update({
    where: { id: agentId },
    data: {
      sessionCookie: "",
      cookieExpires: null,
      status: "offline",
      loginError: null,
    },
  });

  // Invalidate cache
  try {
    await app.redis.del("cache:active_agents");
  } catch {
    /* ignore */
  }

  logger.info({ agentId }, "Agent đã logout");
}

export async function loginAllAgents(
  app: FastifyInstance,
  triggeredBy: string,
  ipAddress: string | null = null,
): Promise<{ total: number; success: number; failed: number }> {
  const agents = await app.prisma.agent.findMany({
    where: {
      isActive: true,
      extPassword: { not: "" },
      OR: [{ status: { in: ["offline", "error"] } }, { cookieExpires: { lt: new Date() } }],
    },
    select: { id: true },
  });

  logger.info({ count: agents.length }, "Bắt đầu login tất cả agents");

  let success = 0;
  let failed = 0;

  for (const agent of agents) {
    try {
      await loginAgent(app, agent.id, triggeredBy, ipAddress);
      success++;
    } catch (err) {
      logger.error({ agentId: agent.id, error: (err as Error).message }, "Login agent thất bại");
      failed++;
    }
    // Delay 3-5s between logins
    await sleep(3000 + Math.random() * 2000);
  }

  return { total: agents.length, success, failed };
}

/**
 * Check session — gọi upstream members (limit=1) để verify cookie.
 */
export async function checkAgentSession(
  app: FastifyInstance,
  agentId: string,
): Promise<{ valid: boolean; reason?: string; agentName?: string }> {
  const agent = await app.prisma.agent.findUnique({
    where: { id: agentId },
    select: { id: true, name: true, sessionCookie: true, status: true },
  });

  if (!agent) return { valid: false, reason: "not_found" };
  if (!agent.sessionCookie) return { valid: false, reason: "no_cookie", agentName: agent.name };

  try {
    const cookie = decryptSessionCookie(agent.sessionCookie);
    await fetchUpstream({
      path: "/agent/user.html",
      cookie,
      params: { page: "1", limit: "1" },
    });

    if (agent.status !== "active") {
      await app.prisma.agent.update({
        where: { id: agentId },
        data: { status: "active", loginError: null },
      });
    }

    return { valid: true, agentName: agent.name };
  } catch {
    await app.prisma.agent.update({
      where: { id: agentId },
      data: { status: "error", loginError: "Session hết hạn (kiểm tra thủ công)" },
    });

    return { valid: false, reason: "expired", agentName: agent.name };
  }
}

export async function getSessionInfo(app: FastifyInstance, agentId: string) {
  const agent = await app.prisma.agent.findUnique({
    where: { id: agentId },
    select: {
      id: true,
      name: true,
      status: true,
      sessionCookie: true,
      cookieExpires: true,
      lastLoginAt: true,
      loginError: true,
    },
  });

  if (!agent) return null;

  return {
    id: agent.id,
    name: agent.name,
    status: agent.status,
    hasSession: !!agent.sessionCookie,
    cookieExpires: agent.cookieExpires,
    lastLoginAt: agent.lastLoginAt,
    loginError: agent.loginError,
  };
}

/**
 * Set cookie thủ công — dùng cookie lấy từ trình duyệt (dev tools).
 */
export async function setCookieManual(app: FastifyInstance, agentId: string, cookie: string): Promise<void> {
  const agent = await app.prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) throw new AppError("Agent không tồn tại", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);

  await app.prisma.agent.update({
    where: { id: agentId },
    data: {
      sessionCookie: encryptSessionCookie(cookie),
      cookieExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "active",
      lastLoginAt: new Date(),
      loginError: null,
      loginAttempts: 0,
    },
  });

  // Invalidate active agents cache + proxy cache for this agent
  try {
    await app.redis.del("cache:active_agents");
  } catch {
    /* ignore */
  }
  try {
    const { invalidateAgentProxyCache } = await import("../proxy/agent.service.js");
    await invalidateAgentProxyCache(app, agentId);
  } catch {
    /* ignore */
  }

  logger.info({ agentId, agentName: agent.name }, "Đã set cookie thủ công");
}

// --- Helpers ---

async function setAgentError(app: FastifyInstance, agentId: string, errorMsg: string): Promise<void> {
  await app.prisma.agent.update({
    where: { id: agentId },
    data: {
      status: "error",
      loginError: errorMsg,
      loginAttempts: { increment: 1 },
    },
  });
}

async function logLoginAttempt(
  app: FastifyInstance,
  agentId: string,
  success: boolean,
  captchaAttempts: number,
  errorMessage: string | null,
  ipAddress: string | null,
  triggeredBy: string,
): Promise<void> {
  await app.prisma.agentLoginHistory.create({
    data: {
      agentId,
      success,
      captchaAttempts,
      errorMessage,
      ipAddress,
      triggeredBy,
    },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
