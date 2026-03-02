import { logger } from "./logger.js";

export interface AuditEntry {
  action: string;
  userId: string;
  targetType?: string;
  targetId?: string;
  detail?: Record<string, unknown>;
  ip?: string;
}

/**
 * Write an audit log entry.
 * Currently logs to structured logger. Can be extended to write to DB table.
 */
export function audit(entry: AuditEntry): void {
  logger.info("AUDIT", {
    action: entry.action,
    userId: entry.userId,
    targetType: entry.targetType,
    targetId: entry.targetId,
    detail: entry.detail,
    ip: entry.ip,
    timestamp: new Date().toISOString(),
  });
}
