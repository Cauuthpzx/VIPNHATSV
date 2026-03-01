import { appConfig } from "../config/app.js";

type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace";

const LEVELS: Record<LogLevel, number> = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
};

const currentLevel = LEVELS[appConfig.logLevel] ?? LEVELS.info;

function write(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (LEVELS[level] < currentLevel) return;

  const entry = {
    level,
    time: new Date().toISOString(),
    msg: message,
    ...meta,
  };

  const output = JSON.stringify(entry);

  if (LEVELS[level] >= LEVELS.error) {
    process.stderr.write(output + "\n");
  } else {
    process.stdout.write(output + "\n");
  }
}

export const logger = {
  fatal: (msg: string, meta?: Record<string, unknown>) => write("fatal", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => write("error", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => write("warn", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => write("info", msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) => write("debug", msg, meta),
  trace: (msg: string, meta?: Record<string, unknown>) => write("trace", msg, meta),
};
