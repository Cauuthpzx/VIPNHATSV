import { PERMISSIONS } from "@/constants/permissions";

export interface MenuChild {
  id: string;
  title: string;
  path: string;
  permission?: string;
}

export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  permission?: string;
  children: MenuChild[];
}

export const menuData: MenuItem[] = [
  {
    id: "member",
    title: "Quản lí hội viên thuộc cấp",
    icon: "layui-icon-username",
    children: [
      { id: "user", title: "Danh sách hội viên", path: "/agent/user" },
    ],
  },
  {
    id: "invite",
    title: "Mã giới thiệu",
    icon: "layui-icon-vercode",
    children: [
      { id: "inviteList", title: "Danh sách mã giới thiệu", path: "/agent/invite-list" },
    ],
  },
  {
    id: "report",
    title: "Báo cáo",
    icon: "layui-icon-tabs",
    children: [
      { id: "reportLottery", title: "Báo cáo xổ số", path: "/agent/report-lottery" },
      { id: "reportFunds", title: "Sao kê giao dịch", path: "/agent/report-funds" },
      { id: "reportThirdGame", title: "Báo cáo nhà cung cấp", path: "/agent/report-third-game" },
    ],
  },
  {
    id: "commission",
    title: "Rút hoa hồng",
    icon: "layui-icon-dollar",
    children: [
      { id: "bankList", title: "Danh sách thẻ ngân hàng", path: "/agent/bank-list" },
      { id: "deposit", title: "Danh sách nạp tiền", path: "/agent/deposit" },
      { id: "withdrawalsRecord", title: "Lịch sử rút tiền", path: "/agent/withdrawals-record" },
      { id: "withdraw", title: "Rút tiền", path: "/agent/withdraw" },
    ],
  },
  {
    id: "bet",
    title: "Quản lí đơn cược",
    icon: "layui-icon-chart-screen",
    children: [
      { id: "betList", title: "Danh sách đơn cược", path: "/agent/bet" },
      { id: "betOrder", title: "Đơn cược bên thứ 3", path: "/agent/bet-order" },
    ],
  },
  {
    id: "customer",
    title: "Thông tin khách hàng",
    icon: "layui-icon-survey",
    children: [
      { id: "editPassword", title: "Đổi mật khẩu đăng nhập", path: "/agent/edit-password" },
      { id: "editFundPassword", title: "Đổi mật khẩu giao dịch", path: "/agent/edit-fund-password" },
    ],
  },
  {
    id: "rebate",
    title: "Quản lí tỉ lệ hoàn trả",
    icon: "layui-icon-list",
    children: [
      { id: "rebateOdds", title: "Danh sách tỉ lệ hoàn trả", path: "/agent/rebate-odds" },
    ],
  },
  {
    id: "system",
    title: "SYSTEM",
    icon: "layui-icon-set",
    children: [
      { id: "systemUsers", title: "Quản lý người dùng", path: "/system/users", permission: PERMISSIONS.USERS_READ },
      { id: "systemRoles", title: "Quản lý vai trò", path: "/system/roles", permission: PERMISSIONS.ROLES_READ },
    ],
  },
];
