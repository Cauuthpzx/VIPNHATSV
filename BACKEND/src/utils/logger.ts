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

// Overloaded: supports both (msg, meta?) and pino-style (meta, msg)
function log(level: LogLevel, a: string | Record<string, unknown>, b?: string | Record<string, unknown>) {
  if (typeof a === "string") {
    write(level, a, b as Record<string, unknown> | undefined);
  } else {
    write(level, (b as string) ?? "", a);
  }
}

export const logger = {
  fatal: (a: string | Record<string, unknown>, b?: string | Record<string, unknown>) => log("fatal", a, b),
  error: (a: string | Record<string, unknown>, b?: string | Record<string, unknown>) => log("error", a, b),
  warn:  (a: string | Record<string, unknown>, b?: string | Record<string, unknown>) => log("warn", a, b),
  info:  (a: string | Record<string, unknown>, b?: string | Record<string, unknown>) => log("info", a, b),
  debug: (a: string | Record<string, unknown>, b?: string | Record<string, unknown>) => log("debug", a, b),
  trace: (a: string | Record<string, unknown>, b?: string | Record<string, unknown>) => log("trace", a, b),
};
