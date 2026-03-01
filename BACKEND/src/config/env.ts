import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(8),
  JWT_REFRESH_SECRET: z.string().min(8),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),

  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  REDIS_URL: z.string().default("redis://localhost:6379"),
  UPSTREAM_BASE_URL: z.string().default("https://a2u4k.ee88dly.com"),
  UPSTREAM_TIMEOUT_MS: z.coerce.number().default(15_000),
  ENCRYPTION_KEY: z.string().length(64),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid environment variables:", result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const env = validateEnv();
