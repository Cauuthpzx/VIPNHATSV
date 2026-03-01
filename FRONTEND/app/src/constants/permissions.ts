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

  // --- SYNC ---
  SYNC_READ: "sync:read",
  SYNC_WRITE: "sync:write",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS = "*";

/** Nhóm permissions cho UI phân quyền */
export const PERMISSION_GROUPS = [
  {
    label: "Hội viên",
    permissions: ["member:read", "member:write"],
  },
  {
    label: "Mã giới thiệu",
    permissions: ["invite:read", "invite:write"],
  },
  {
    label: "Báo cáo",
    permissions: ["report:read"],
  },
  {
    label: "Tài chính",
    permissions: ["finance:read", "finance:write"],
  },
  {
    label: "Đơn cược",
    permissions: ["bet:read"],
  },
  {
    label: "Mật khẩu",
    permissions: ["password:write"],
  },
  {
    label: "Hoàn trả",
    permissions: ["rebate:read"],
  },
  {
    label: "Đồng bộ",
    permissions: ["sync:read", "sync:write"],
  },
  {
    label: "Hệ thống",
    permissions: ["users:read", "users:write", "users:delete", "roles:read", "roles:write", "roles:delete"],
  },
];

export const PERMISSION_LABELS: Record<string, string> = {
  // SYSTEM
  "users:read": "Xem người dùng",
  "users:write": "Tạo/sửa người dùng",
  "users:delete": "Xóa người dùng",
  "roles:read": "Xem vai trò",
  "roles:write": "Tạo/sửa vai trò",
  "roles:delete": "Xóa vai trò",
  // AGENT
  "member:read": "Xem hội viên",
  "member:write": "Thêm/sửa hội viên",
  "invite:read": "Xem mã giới thiệu",
  "invite:write": "Quản lý mã giới thiệu",
  "report:read": "Xem báo cáo",
  "finance:read": "Xem tài chính",
  "finance:write": "Quản lý ngân hàng",
  "bet:read": "Xem đơn cược",
  "password:write": "Đổi mật khẩu",
  "rebate:read": "Xem hoàn trả",
  // SYNC
  "sync:read": "Xem đồng bộ",
  "sync:write": "Quản lý đồng bộ",
};
