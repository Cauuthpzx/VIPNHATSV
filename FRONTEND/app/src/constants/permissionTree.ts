import { PERMISSIONS } from "./permissions";

export const GROUP_PREFIX = "group:";

const ALL_PERM_VALUES = new Set(Object.values(PERMISSIONS));

export function isRealPermission(id: string): boolean {
  return ALL_PERM_VALUES.has(id as any);
}

export function extractPermissions(checkedKeys: (string | number)[]): string[] {
  return checkedKeys.filter((k) => isRealPermission(String(k))) as string[];
}

/** Build permission tree with i18n-resolved titles. Pass t() from useI18n(). */
export function buildPermissionTreeData(t: (key: string) => string) {
  return [
    {
      id: "group:member",
      title: t("permTree.memberGroup"),
      icon: "layui-icon-username",
      spread: true,
      children: [
        {
          id: PERMISSIONS.MEMBER_READ,
          title: t("permTree.memberList"),
          children: [
            { id: PERMISSIONS.MEMBER_WRITE, title: t("permTree.memberWrite") },
          ],
        },
      ],
    },
    {
      id: "group:invite",
      title: t("permTree.inviteGroup"),
      icon: "layui-icon-vercode",
      spread: true,
      children: [
        {
          id: PERMISSIONS.INVITE_READ,
          title: t("permTree.inviteList"),
          children: [
            { id: PERMISSIONS.INVITE_WRITE, title: t("permTree.inviteWrite") },
          ],
        },
      ],
    },
    {
      id: "group:report",
      title: t("permTree.reportGroup"),
      icon: "layui-icon-tabs",
      spread: true,
      children: [
        { id: PERMISSIONS.REPORT_READ, title: t("permTree.reportRead") },
      ],
    },
    {
      id: "group:commission",
      title: t("permTree.commissionGroup"),
      icon: "layui-icon-dollar",
      spread: true,
      children: [
        {
          id: PERMISSIONS.FINANCE_READ,
          title: t("permTree.financeRead"),
          children: [
            { id: PERMISSIONS.FINANCE_WRITE, title: t("permTree.financeWrite") },
          ],
        },
      ],
    },
    {
      id: "group:bet",
      title: t("permTree.betGroup"),
      icon: "layui-icon-chart-screen",
      spread: true,
      children: [
        { id: PERMISSIONS.BET_READ, title: t("permTree.betRead") },
      ],
    },
    {
      id: "group:customer",
      title: t("permTree.customerGroup"),
      icon: "layui-icon-survey",
      spread: true,
      children: [
        { id: PERMISSIONS.PASSWORD_WRITE, title: t("permTree.passwordWrite") },
      ],
    },
    {
      id: "group:rebate",
      title: t("permTree.rebateGroup"),
      icon: "layui-icon-list",
      spread: true,
      children: [
        { id: PERMISSIONS.REBATE_READ, title: t("permTree.rebateRead") },
      ],
    },
    {
      id: "group:system",
      title: t("permTree.systemGroup"),
      icon: "layui-icon-set",
      spread: true,
      children: [
        {
          id: PERMISSIONS.USERS_READ,
          title: t("permTree.usersRead"),
          children: [
            { id: PERMISSIONS.USERS_WRITE, title: t("permTree.usersWrite") },
            { id: PERMISSIONS.USERS_DELETE, title: t("permTree.usersDelete") },
          ],
        },
        {
          id: PERMISSIONS.ROLES_READ,
          title: t("permTree.rolesRead"),
          children: [
            { id: PERMISSIONS.ROLES_WRITE, title: t("permTree.rolesWrite") },
            { id: PERMISSIONS.ROLES_DELETE, title: t("permTree.rolesDelete") },
          ],
        },
        {
          id: PERMISSIONS.SYNC_READ,
          title: t("permTree.syncRead"),
          children: [
            { id: PERMISSIONS.SYNC_WRITE, title: t("permTree.syncWrite") },
          ],
        },
      ],
    },
  ];
}
