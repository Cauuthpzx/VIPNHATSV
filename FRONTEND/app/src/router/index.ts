import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { PERMISSIONS } from "@/constants/permissions";

const routes = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/pages/Login.vue"),
    meta: { title: "Đăng nhập", public: true },
  },
  {
    path: "/",
    component: () => import("@/layouts/DefaultLayout.vue"),
    redirect: "/agent/welcome",
    children: [
      {
        path: "agent/welcome",
        name: "Welcome",
        component: () => import("@/pages/Welcome.vue"),
        meta: { title: "Trang chủ" },
      },
      {
        path: "agent/user",
        name: "UserList",
        component: () => import("@/pages/agent/UserList.vue"),
        meta: { title: "Danh sách hội viên", permission: PERMISSIONS.MEMBER_READ },
      },
      {
        path: "agent/invite-list",
        name: "InviteList",
        component: () => import("@/pages/agent/InviteList.vue"),
        meta: { title: "Danh sách mã giới thiệu", permission: PERMISSIONS.INVITE_READ },
      },
      {
        path: "agent/report-lottery",
        name: "ReportLottery",
        component: () => import("@/pages/agent/ReportLottery.vue"),
        meta: { title: "Báo cáo xổ số", permission: PERMISSIONS.REPORT_READ },
      },
      {
        path: "agent/report-funds",
        name: "ReportFunds",
        component: () => import("@/pages/agent/ReportFunds.vue"),
        meta: { title: "Sao kê giao dịch", permission: PERMISSIONS.REPORT_READ },
      },
      {
        path: "agent/report-third-game",
        name: "ReportThirdGame",
        component: () => import("@/pages/agent/ReportThirdGame.vue"),
        meta: { title: "Báo cáo nhà cung cấp", permission: PERMISSIONS.REPORT_READ },
      },
      {
        path: "agent/bank-list",
        name: "BankList",
        component: () => import("@/pages/agent/BankList.vue"),
        meta: { title: "Danh sách thẻ ngân hàng", permission: PERMISSIONS.FINANCE_READ },
      },
      {
        path: "agent/deposit",
        name: "Deposit",
        component: () => import("@/pages/agent/DepositList.vue"),
        meta: { title: "Danh sách nạp tiền", permission: PERMISSIONS.FINANCE_READ },
      },
      {
        path: "agent/withdrawals-record",
        name: "WithdrawalsRecord",
        component: () => import("@/pages/agent/WithdrawalsRecord.vue"),
        meta: { title: "Lịch sử rút tiền", permission: PERMISSIONS.FINANCE_READ },
      },
      {
        path: "agent/withdraw",
        name: "Withdraw",
        component: () => import("@/pages/agent/Withdraw.vue"),
        meta: { title: "Rút tiền", permission: PERMISSIONS.FINANCE_READ },
      },
      {
        path: "agent/bet",
        name: "BetList",
        component: () => import("@/pages/agent/BetList.vue"),
        meta: { title: "Danh sách đơn cược", permission: PERMISSIONS.BET_READ },
      },
      {
        path: "agent/bet-order",
        name: "BetOrder",
        component: () => import("@/pages/agent/BetOrder.vue"),
        meta: { title: "Đơn cược bên thứ 3", permission: PERMISSIONS.BET_READ },
      },
      {
        path: "agent/profile",
        name: "Profile",
        component: () => import("@/pages/agent/Profile.vue"),
        meta: { title: "Thông Tin Tài Khoản" },
      },
      {
        path: "agent/edit-password",
        name: "EditPassword",
        component: () => import("@/pages/agent/EditPassword.vue"),
        meta: { title: "Đổi mật khẩu đăng nhập", permission: PERMISSIONS.PASSWORD_WRITE },
      },
      {
        path: "agent/edit-fund-password",
        name: "EditFundPassword",
        component: () => import("@/pages/agent/EditFundPassword.vue"),
        meta: { title: "Đổi mật khẩu giao dịch", permission: PERMISSIONS.PASSWORD_WRITE },
      },
      {
        path: "agent/rebate-odds",
        name: "RebateOdds",
        component: () => import("@/pages/agent/RebateOdds.vue"),
        meta: { title: "Danh sách tỉ lệ hoàn trả", permission: PERMISSIONS.REBATE_READ },
      },
      // --- SYSTEM ---
      {
        path: "system/users",
        name: "SystemUsers",
        component: () => import("@/pages/system/SystemUsers.vue"),
        meta: { title: "Quản lý người dùng", permission: PERMISSIONS.USERS_READ },
      },
      {
        path: "system/roles",
        name: "SystemRoles",
        component: () => import("@/pages/system/SystemRoles.vue"),
        meta: { title: "Quản lý vai trò", permission: PERMISSIONS.ROLES_READ },
      },
      {
        path: "system/sync",
        name: "SyncDashboard",
        component: () => import("@/pages/system/SyncDashboard.vue"),
        meta: { title: "Theo dõi đồng bộ", permission: PERMISSIONS.SYNC_READ },
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/pages/NotFound.vue"),
    meta: { title: "Không tìm thấy trang", public: true },
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
