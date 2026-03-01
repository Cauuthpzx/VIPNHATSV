import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

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
        meta: { title: "Danh sách hội viên" },
      },
      {
        path: "agent/invite-list",
        name: "InviteList",
        component: () => import("@/pages/agent/InviteList.vue"),
        meta: { title: "Danh sách mã giới thiệu" },
      },
      {
        path: "agent/report-lottery",
        name: "ReportLottery",
        component: () => import("@/pages/agent/ReportLottery.vue"),
        meta: { title: "Báo cáo xổ số" },
      },
      {
        path: "agent/report-funds",
        name: "ReportFunds",
        component: () => import("@/pages/agent/ReportFunds.vue"),
        meta: { title: "Sao kê giao dịch" },
      },
      {
        path: "agent/report-third-game",
        name: "ReportThirdGame",
        component: () => import("@/pages/agent/ReportThirdGame.vue"),
        meta: { title: "Báo cáo nhà cung cấp" },
      },
      {
        path: "agent/bank-list",
        name: "BankList",
        component: () => import("@/pages/agent/BankList.vue"),
        meta: { title: "Danh sách thẻ ngân hàng" },
      },
      {
        path: "agent/deposit",
        name: "Deposit",
        component: () => import("@/pages/agent/DepositList.vue"),
        meta: { title: "Danh sách nạp tiền" },
      },
      {
        path: "agent/withdrawals-record",
        name: "WithdrawalsRecord",
        component: () => import("@/pages/agent/WithdrawalsRecord.vue"),
        meta: { title: "Lịch sử rút tiền" },
      },
      {
        path: "agent/withdraw",
        name: "Withdraw",
        component: () => import("@/pages/agent/Withdraw.vue"),
        meta: { title: "Rút tiền" },
      },
      {
        path: "agent/bet",
        name: "BetList",
        component: () => import("@/pages/agent/BetList.vue"),
        meta: { title: "Danh sách đơn cược" },
      },
      {
        path: "agent/bet-order",
        name: "BetOrder",
        component: () => import("@/pages/agent/BetOrder.vue"),
        meta: { title: "Đơn cược bên thứ 3" },
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
        meta: { title: "Đổi mật khẩu đăng nhập" },
      },
      {
        path: "agent/edit-fund-password",
        name: "EditFundPassword",
        component: () => import("@/pages/agent/EditFundPassword.vue"),
        meta: { title: "Đổi mật khẩu giao dịch" },
      },
      {
        path: "agent/rebate-odds",
        name: "RebateOdds",
        component: () => import("@/pages/agent/RebateOdds.vue"),
        meta: { title: "Danh sách tỉ lệ hoàn trả" },
      },
    ],
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  // Initialize auth on first navigation
  if (!authStore.initialized) {
    await authStore.init();
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

  return true;
});
