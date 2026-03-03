import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { PERMISSIONS } from "@/constants/permissions";

const routes = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/pages/Login.vue"),
    meta: { titleKey: "auth.tabLogin", public: true },
  },
  {
    path: "/",
    component: () => import("@/layouts/DefaultLayout.vue"),
    redirect: "/agent/welcome",
    children: [
      {
        path: "agent/welcome",
        name: "Dashboard",
        component: () => import("@/pages/Dashboard.vue"),
        meta: { titleKey: "menu.home" },
      },
      {
        path: "agent/user",
        name: "UserList",
        component: () => import("@/pages/agent/UserList.vue"),
        meta: { titleKey: "menu.userList", permission: PERMISSIONS.MEMBER_READ },
      },
      {
        path: "agent/invite-list",
        name: "InviteList",
        component: () => import("@/pages/agent/InviteList.vue"),
        meta: { titleKey: "menu.inviteList", permission: PERMISSIONS.INVITE_READ },
      },
      {
        path: "agent/report-lottery",
        name: "ReportLottery",
        component: () => import("@/pages/agent/ReportLottery.vue"),
        meta: { titleKey: "menu.reportLottery", permission: PERMISSIONS.REPORT_READ },
      },
      {
        path: "agent/report-funds",
        name: "ReportFunds",
        component: () => import("@/pages/agent/ReportFunds.vue"),
        meta: { titleKey: "menu.reportFunds", permission: PERMISSIONS.REPORT_READ },
      },
      {
        path: "agent/report-third-game",
        name: "ReportThirdGame",
        component: () => import("@/pages/agent/ReportThirdGame.vue"),
        meta: { titleKey: "menu.reportThirdGame", permission: PERMISSIONS.REPORT_READ },
      },
      {
        path: "agent/bank-list",
        name: "BankList",
        component: () => import("@/pages/agent/BankList.vue"),
        meta: { titleKey: "menu.bankList", permission: PERMISSIONS.FINANCE_READ },
      },
      {
        path: "agent/deposit",
        name: "Deposit",
        component: () => import("@/pages/agent/DepositList.vue"),
        meta: { titleKey: "menu.deposit", permission: PERMISSIONS.FINANCE_READ },
      },
      {
        path: "agent/withdrawals-record",
        name: "WithdrawalsRecord",
        component: () => import("@/pages/agent/WithdrawalsRecord.vue"),
        meta: { titleKey: "menu.withdrawalsRecord", permission: PERMISSIONS.FINANCE_READ },
      },
      {
        path: "agent/withdraw",
        name: "Withdraw",
        component: () => import("@/pages/agent/Withdraw.vue"),
        meta: { titleKey: "menu.withdraw", permission: PERMISSIONS.FINANCE_READ },
      },
      {
        path: "agent/bet",
        name: "BetList",
        component: () => import("@/pages/agent/BetList.vue"),
        meta: { titleKey: "menu.betList", permission: PERMISSIONS.BET_READ },
      },
      {
        path: "agent/bet-order",
        name: "BetOrder",
        component: () => import("@/pages/agent/BetOrder.vue"),
        meta: { titleKey: "menu.betOrder", permission: PERMISSIONS.BET_READ },
      },
      {
        path: "agent/profile",
        name: "Profile",
        component: () => import("@/pages/agent/Profile.vue"),
        meta: { titleKey: "menu.profile" },
      },
      {
        path: "agent/edit-password",
        name: "EditPassword",
        component: () => import("@/pages/agent/EditPassword.vue"),
        meta: { titleKey: "menu.editPassword", permission: PERMISSIONS.PASSWORD_WRITE },
      },
      {
        path: "agent/edit-fund-password",
        name: "EditFundPassword",
        component: () => import("@/pages/agent/EditFundPassword.vue"),
        meta: { titleKey: "menu.editFundPassword", permission: PERMISSIONS.PASSWORD_WRITE },
      },
      {
        path: "agent/rebate-odds",
        name: "RebateOdds",
        component: () => import("@/pages/agent/RebateOdds.vue"),
        meta: { titleKey: "menu.rebateOdds", permission: PERMISSIONS.REBATE_READ },
      },
      // --- ANALYTICS ---
      {
        path: "analytics/finance",
        name: "AnalyticsFinance",
        component: () => import("@/pages/analytics/AnalyticsFinance.vue"),
        meta: { titleKey: "menu.analyticsFinance", permission: PERMISSIONS.ANALYTICS_READ },
      },
      {
        path: "analytics/betting",
        name: "AnalyticsBetting",
        component: () => import("@/pages/analytics/AnalyticsBetting.vue"),
        meta: { titleKey: "menu.analyticsBetting", permission: PERMISSIONS.ANALYTICS_READ },
      },
      {
        path: "analytics/members",
        name: "AnalyticsMembers",
        component: () => import("@/pages/analytics/AnalyticsMembers.vue"),
        meta: { titleKey: "menu.analyticsMembers", permission: PERMISSIONS.ANALYTICS_READ },
      },
      {
        path: "analytics/agents",
        name: "AnalyticsAgents",
        component: () => import("@/pages/analytics/AnalyticsAgents.vue"),
        meta: { titleKey: "menu.analyticsAgents", permission: PERMISSIONS.ANALYTICS_READ },
      },
      {
        path: "analytics/revenue",
        name: "AnalyticsRevenue",
        component: () => import("@/pages/analytics/AnalyticsRevenue.vue"),
        meta: { titleKey: "menu.analyticsRevenue", permission: PERMISSIONS.ANALYTICS_READ },
      },
      // --- SYSTEM ---
      {
        path: "system/users",
        name: "SystemUsers",
        component: () => import("@/pages/system/SystemUsers.vue"),
        meta: { titleKey: "menu.systemUsers", permission: PERMISSIONS.USERS_READ },
      },
      {
        path: "system/roles",
        name: "SystemRoles",
        component: () => import("@/pages/system/SystemRoles.vue"),
        meta: { titleKey: "menu.systemRoles", permission: PERMISSIONS.ROLES_READ },
      },
      {
        path: "system/sync",
        name: "SyncDashboard",
        component: () => import("@/pages/system/SyncDashboard.vue"),
        meta: { titleKey: "menu.syncDashboard", permission: PERMISSIONS.SYNC_READ },
      },
      {
        path: "system/sync-v2",
        name: "SyncV2",
        component: () => import("@/pages/system/SyncV2.vue"),
        meta: { titleKey: "menu.syncV2", permission: PERMISSIONS.SYNC_READ },
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/pages/NotFound.vue"),
    meta: { titleKey: "notFound.routeTitle", public: true },
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  // Đảm bảo auth init xong trước khi kiểm tra
  if (!authStore.initialized) {
    try {
      await authStore.init();
    } catch {
      authStore.initialized = true;
    }
  }

  if (to.meta.public) {
    // If already logged in and going to login page, redirect to welcome
    if (authStore.isLoggedIn && to.path === "/login") {
      return "/agent/welcome";
    }
    return true;
  }

  // Protected route: check auth
  if (!authStore.isLoggedIn) {
    return "/login";
  }

  // Refresh user data (permissions) on each navigation so changes take effect
  // without requiring logout/reload. For permission-guarded routes, await the
  // result so the guard uses fresh permissions. For other routes, fire-and-forget
  // so the menu reactively updates in the background.
  const requiredPermission = to.meta.permission as string | undefined;
  if (requiredPermission) {
    await authStore.fetchMe();
    if (!authStore.hasPermission(requiredPermission)) {
      return "/agent/welcome";
    }
  } else {
    authStore.fetchMe();
  }

  return true;
});
