export const PERMISSIONS = {
  USERS_READ: "users:read",
  USERS_WRITE: "users:write",
  USERS_DELETE: "users:delete",
  ROLES_READ: "roles:read",
  ROLES_WRITE: "roles:write",
  ROLES_DELETE: "roles:delete",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS = "*";
