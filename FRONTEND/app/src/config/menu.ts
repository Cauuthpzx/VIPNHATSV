import { PERMISSIONS } from "@/constants/permissions";

export interface MenuChild {
  id: string;
  titleKey: string;
  path: string;
  permission?: string;
}

export interface MenuItem {
  id: string;
  titleKey: string;
  icon: string;
  permission?: string;
  path?: string; // menu đơn (không có sub)
  children: MenuChild[];
}

export const menuData: MenuItem[] = [
  {
    id: "home",
    titleKey: "menu.home",
    icon: "layui-icon-home",
    path: "/agent/welcome",
    children: [],
  },
  {
    id: "analytics",
    titleKey: "menu.analytics",
    icon: "layui-icon-chart",
    children: [
      { id: "analyticsFinance", titleKey: "menu.analyticsFinance", path: "/analytics/finance", permission: PERMISSIONS.ANALYTICS_READ },
      { id: "analyticsBetting", titleKey: "menu.analyticsBetting", path: "/analytics/betting", permission: PERMISSIONS.ANALYTICS_READ },
      { id: "analyticsMembers", titleKey: "menu.analyticsMembers", path: "/analytics/members", permission: PERMISSIONS.ANALYTICS_READ },
      { id: "analyticsAgents", titleKey: "menu.analyticsAgents", path: "/analytics/agents", permission: PERMISSIONS.ANALYTICS_READ },
      { id: "analyticsRevenue", titleKey: "menu.analyticsRevenue", path: "/analytics/revenue", permission: PERMISSIONS.ANALYTICS_READ },
    ],
  },
  {
    id: "member",
    titleKey: "menu.member",
    icon: "layui-icon-username",
    children: [
      { id: "user", titleKey: "menu.userList", path: "/agent/user", permission: PERMISSIONS.MEMBER_READ },
    ],
  },
  {
    id: "invite",
    titleKey: "menu.invite",
    icon: "layui-icon-vercode",
    children: [
      { id: "inviteList", titleKey: "menu.inviteList", path: "/agent/invite-list", permission: PERMISSIONS.INVITE_READ },
    ],
  },
  {
    id: "report",
    titleKey: "menu.report",
    icon: "layui-icon-tabs",
    children: [
      { id: "reportLottery", titleKey: "menu.reportLottery", path: "/agent/report-lottery", permission: PERMISSIONS.REPORT_READ },
      { id: "reportFunds", titleKey: "menu.reportFunds", path: "/agent/report-funds", permission: PERMISSIONS.REPORT_READ },
      { id: "reportThirdGame", titleKey: "menu.reportThirdGame", path: "/agent/report-third-game", permission: PERMISSIONS.REPORT_READ },
    ],
  },
  {
    id: "commission",
    titleKey: "menu.commission",
    icon: "layui-icon-dollar",
    children: [
      // { id: "bankList", titleKey: "menu.bankList", path: "/agent/bank-list", permission: PERMISSIONS.FINANCE_READ },
      { id: "deposit", titleKey: "menu.deposit", path: "/agent/deposit", permission: PERMISSIONS.FINANCE_READ },
      { id: "withdrawalsRecord", titleKey: "menu.withdrawalsRecord", path: "/agent/withdrawals-record", permission: PERMISSIONS.FINANCE_READ },
      // { id: "withdraw", titleKey: "menu.withdraw", path: "/agent/withdraw", permission: PERMISSIONS.FINANCE_READ },
    ],
  },
  {
    id: "bet",
    titleKey: "menu.bet",
    icon: "layui-icon-chart-screen",
    children: [
      { id: "betList", titleKey: "menu.betList", path: "/agent/bet", permission: PERMISSIONS.BET_READ },
      { id: "betOrder", titleKey: "menu.betOrder", path: "/agent/bet-order", permission: PERMISSIONS.BET_READ },
    ],
  },
  // {
  //   id: "customer",
  //   titleKey: "menu.customer",
  //   icon: "layui-icon-survey",
  //   children: [
  //     { id: "editPassword", titleKey: "menu.editPassword", path: "/agent/edit-password", permission: PERMISSIONS.PASSWORD_WRITE },
  //     { id: "editFundPassword", titleKey: "menu.editFundPassword", path: "/agent/edit-fund-password", permission: PERMISSIONS.PASSWORD_WRITE },
  //   ],
  // },
  // {
  //   id: "rebate",
  //   titleKey: "menu.rebate",
  //   icon: "layui-icon-list",
  //   children: [
  //     { id: "rebateOdds", titleKey: "menu.rebateOdds", path: "/agent/rebate-odds", permission: PERMISSIONS.REBATE_READ },
  //   ],
  // },
  {
    id: "system",
    titleKey: "menu.system",
    icon: "layui-icon-set",
    children: [
      { id: "systemUsers", titleKey: "menu.systemUsers", path: "/system/users", permission: PERMISSIONS.USERS_READ },
      { id: "systemRoles", titleKey: "menu.systemRoles", path: "/system/roles", permission: PERMISSIONS.ROLES_READ },
      { id: "syncDashboard", titleKey: "menu.syncDashboard", path: "/system/sync", permission: PERMISSIONS.SYNC_READ },
    ],
  },
];
