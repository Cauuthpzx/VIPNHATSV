import { env } from "./env.js";

export const appConfig = {
  isProduction: env.NODE_ENV === "production",
  isDevelopment: env.NODE_ENV === "development",
  host: env.HOST,
  port: env.PORT,
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  cors: {
    origin: env.CORS_ORIGIN,
  },
  rateLimit: {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
  },
  logLevel: env.LOG_LEVEL,
  gracefulShutdownTimeout: 10_000,
} as const;
