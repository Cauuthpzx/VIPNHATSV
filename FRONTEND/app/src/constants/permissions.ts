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

/** i18n keys for permission group labels */
export const PERMISSION_GROUP_KEYS: { labelKey: string; permissions: string[] }[] = [
  { labelKey: "permissions.groupMember", permissions: ["member:read", "member:write"] },
  { labelKey: "permissions.groupInvite", permissions: ["invite:read", "invite:write"] },
  { labelKey: "permissions.groupReport", permissions: ["report:read"] },
  { labelKey: "permissions.groupFinance", permissions: ["finance:read", "finance:write"] },
  { labelKey: "permissions.groupBet", permissions: ["bet:read"] },
  { labelKey: "permissions.groupPassword", permissions: ["password:write"] },
  { labelKey: "permissions.groupRebate", permissions: ["rebate:read"] },
  { labelKey: "permissions.groupAnalytics", permissions: ["analytics:read"] },
  { labelKey: "permissions.groupSync", permissions: ["sync:read", "sync:write"] },
  { labelKey: "permissions.groupSystem", permissions: ["users:read", "users:write", "users:delete", "roles:read", "roles:write", "roles:delete"] },
];

/** i18n keys for individual permission labels */
export const PERMISSION_LABEL_KEYS: Record<string, string> = {
  "users:read": "permissions.usersRead",
  "users:write": "permissions.usersWrite",
  "users:delete": "permissions.usersDelete",
  "roles:read": "permissions.rolesRead",
  "roles:write": "permissions.rolesWrite",
  "roles:delete": "permissions.rolesDelete",
  "member:read": "permissions.memberRead",
  "member:write": "permissions.memberWrite",
  "invite:read": "permissions.inviteRead",
  "invite:write": "permissions.inviteWrite",
  "report:read": "permissions.reportRead",
  "finance:read": "permissions.financeRead",
  "finance:write": "permissions.financeWrite",
  "bet:read": "permissions.betRead",
  "password:write": "permissions.passwordWrite",
  "rebate:read": "permissions.rebateRead",
  "analytics:read": "permissions.analyticsRead",
  "sync:read": "permissions.syncRead",
  "sync:write": "permissions.syncWrite",
};
