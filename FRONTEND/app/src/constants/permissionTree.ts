import { PERMISSIONS } from "./permissions";

export const GROUP_PREFIX = "group:";

const ALL_PERM_VALUES = new Set(Object.values(PERMISSIONS));

/** Kiểm tra node ID có phải permission thực (không phải group ảo) */
export function isRealPermission(id: string): boolean {
  return ALL_PERM_VALUES.has(id as any);
}

/** Lọc checkedKeys, chỉ giữ permission thực */
export function extractPermissions(checkedKeys: (string | number)[]): string[] {
  return checkedKeys.filter((k) => isRealPermission(String(k))) as string[];
}

/** Cây phân quyền 3 cấp: Menu group → Trang → Hành động */
export function buildPermissionTreeData() {
  return [
    {
      id: "group:member",
      title: "Quản lí hội viên thuộc cấp",
      icon: "layui-icon-username",
      spread: true,
      children: [
        {
          id: PERMISSIONS.MEMBER_READ,
          title: "Danh sách hội viên",
          children: [
            { id: PERMISSIONS.MEMBER_WRITE, title: "Thêm / Sửa hội viên" },
          ],
        },
      ],
    },
    {
      id: "group:invite",
      title: "Mã giới thiệu",
      icon: "layui-icon-vercode",
      spread: true,
      children: [
        {
          id: PERMISSIONS.INVITE_READ,
          title: "Danh sách mã giới thiệu",
          children: [
            { id: PERMISSIONS.INVITE_WRITE, title: "Quản lý mã giới thiệu" },
          ],
        },
      ],
    },
    {
      id: "group:report",
      title: "Báo cáo",
      icon: "layui-icon-tabs",
      spread: true,
      children: [
        { id: PERMISSIONS.REPORT_READ, title: "Xem báo cáo (Xổ số, Giao dịch, NCC)" },
      ],
    },
    {
      id: "group:commission",
      title: "Rút hoa hồng",
      icon: "layui-icon-dollar",
      spread: true,
      children: [
        {
          id: PERMISSIONS.FINANCE_READ,
          title: "Xem tài chính (Ngân hàng, Nạp/Rút tiền)",
          children: [
            { id: PERMISSIONS.FINANCE_WRITE, title: "Quản lý ngân hàng" },
          ],
        },
      ],
    },
    {
      id: "group:bet",
      title: "Quản lí đơn cược",
      icon: "layui-icon-chart-screen",
      spread: true,
      children: [
        { id: PERMISSIONS.BET_READ, title: "Xem đơn cược (Đơn cược, Bên thứ 3)" },
      ],
    },
    {
      id: "group:customer",
      title: "Thông tin khách hàng",
      icon: "layui-icon-survey",
      spread: true,
      children: [
        { id: PERMISSIONS.PASSWORD_WRITE, title: "Đổi mật khẩu (Đăng nhập, Giao dịch)" },
      ],
    },
    {
      id: "group:rebate",
      title: "Quản lí tỉ lệ hoàn trả",
      icon: "layui-icon-list",
      spread: true,
      children: [
        { id: PERMISSIONS.REBATE_READ, title: "Xem tỉ lệ hoàn trả" },
      ],
    },
    {
      id: "group:system",
      title: "SYSTEM",
      icon: "layui-icon-set",
      spread: true,
      children: [
        {
          id: PERMISSIONS.USERS_READ,
          title: "Quản lý người dùng",
          children: [
            { id: PERMISSIONS.USERS_WRITE, title: "Tạo / Sửa người dùng" },
            { id: PERMISSIONS.USERS_DELETE, title: "Xóa người dùng" },
          ],
        },
        {
          id: PERMISSIONS.ROLES_READ,
          title: "Quản lý vai trò",
          children: [
            { id: PERMISSIONS.ROLES_WRITE, title: "Tạo / Sửa vai trò" },
            { id: PERMISSIONS.ROLES_DELETE, title: "Xóa vai trò" },
          ],
        },
        {
          id: PERMISSIONS.SYNC_READ,
          title: "Theo dõi đồng bộ",
          children: [
            { id: PERMISSIONS.SYNC_WRITE, title: "Quản lý đồng bộ" },
          ],
        },
      ],
    },
  ];
}
