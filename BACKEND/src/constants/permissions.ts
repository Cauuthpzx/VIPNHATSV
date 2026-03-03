export const PERMISSIONS = {
  // --- SYSTEM ---
  USERS_READ: "users:read",
  USERS_WRITE: "users:write",
  USERS_DELETE: "users:delete",
  ROLES_READ: "roles:read",
  ROLES_WRITE: "roles:write",
  ROLES_DELETE: "roles:delete",

  // --- AGENT: Hội viên ---
  MEMBER_READ: "member:read",
  MEMBER_WRITE: "member:write",

  // --- AGENT: Mã giới thiệu ---
  INVITE_READ: "invite:read",
  INVITE_WRITE: "invite:write",

  // --- AGENT: Báo cáo ---
  REPORT_READ: "report:read",

  // --- AGENT: Tài chính ---
  FINANCE_READ: "finance:read",
  FINANCE_WRITE: "finance:write",

  // --- AGENT: Đơn cược ---
  BET_READ: "bet:read",

  // --- AGENT: Mật khẩu ---
  PASSWORD_WRITE: "password:write",

  // --- AGENT: Hoàn trả ---
  REBATE_READ: "rebate:read",

  // --- Thống kê & Phân tích ---
  ANALYTICS_READ: "analytics:read",

  // --- SYNC ---
  SYNC_READ: "sync:read",
  SYNC_WRITE: "sync:write",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS = "*";
