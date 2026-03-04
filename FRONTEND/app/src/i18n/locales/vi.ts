export default {
  // ═══════════════════════════════════════════════════════════════════════════
  // COMMON / SHARED
  // ═══════════════════════════════════════════════════════════════════════════
  common: {
    search: "Tìm kiếm",
    reset: "Đặt lại",
    save: "Lưu",
    cancel: "Hủy",
    confirm: "Xác nhận",
    delete: "Xóa",
    edit: "Sửa",
    detail: "Chi tiết",
    create: "Tạo mới",
    update: "Cập nhật",
    close: "Đóng",
    loading: "Đang tải...",
    noData: "Không có dữ liệu",
    actions: "Thao tác",
    all: "Tất cả",
    select: "Chọn",
    agent: "Nhân viên",
    agentLabel: "Nhân viên :",
    username: "Tên tài khoản",
    time: "Thời gian",
    timeLabel: "Thời gian :",
    status: "Trạng thái",
    remark: "Ghi chú",
    amount: "Số tiền",
    dateStart: "Ngày bắt đầu",
    dateEnd: "Ngày kết thúc",
    errorLoad: "Lỗi tải dữ liệu",
    operationFailed: "Thao tác thất bại",
    operationFailedRetry: "Thao tác thất bại, vui lòng thử lại",
    localData: "Dữ liệu local",
    summaryData: "DỮ LIỆU TỔNG HỢP",
    agentAvailable: "Đại lý khả dụng:",
    days: "ngày",
    minutesAgo: " phút trước",
    hoursAgo: " giờ trước",
    daysAgo: " ngày trước",
    justNow: "Vừa xong",
    unknown: "Không rõ",
    online: "Online",
    yes: "Có",
    no: "Không",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYUI COMPONENT OVERRIDES (page, table, input, datePicker, etc.)
  // ═══════════════════════════════════════════════════════════════════════════
  page: {
    previous: "Trang trước",
    next: "Trang sau",
    goTo: "Đến trang thứ",
    confirm: "Xác nhận",
    page: "trang",
    item: "dòng",
    total: "Tổng",
  },
  table: {
    filter: "Lọc",
    export: "Xuất",
    print: "In",
  },
  input: {
    placeholder: "Vui lòng nhập",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DATE RANGE / QUICK SELECT
  // ═══════════════════════════════════════════════════════════════════════════
  dateRange: {
    today: "Hôm nay",
    yesterday: "Hôm qua",
    thisWeek: "Tuần này",
    thisMonth: "Tháng này",
    lastMonth: "Tháng trước",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PASSWORD STRENGTH
  // ═══════════════════════════════════════════════════════════════════════════
  password: {
    minLength: "8+ ký tự",
    uppercase: "Chữ hoa (A-Z)",
    lowercase: "Chữ thường (a-z)",
    number: "Số (0-9)",
    special: "Ký tự đặc biệt (!@#...)",
    weak: "Yếu",
    medium: "Trung bình",
    fair: "Khá",
    strong: "Mạnh",
    oldPassword: "Mật khẩu cũ",
    oldPasswordPlaceholder: "Nhập mật khẩu cũ",
    newPassword: "Mật khẩu mới",
    newPasswordPlaceholder: "Nhập mật khẩu mới",
    confirmPassword: "Xác nhận mật khẩu mới",
    confirmPasswordPlaceholder: "Nhập lại mật khẩu mới",
    changeSuccess: "Đổi mật khẩu thành công",
    enterOld: "Vui lòng nhập mật khẩu cũ",
    enterNew: "Vui lòng nhập mật khẩu mới",
    notStrong: "Mật khẩu chưa đủ mạnh",
    mismatch: "Xác nhận mật khẩu không khớp",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGIN / REGISTER
  // ═══════════════════════════════════════════════════════════════════════════
  auth: {
    pageTitle: "Max HUB Admin – Trung tâm Điều hành Thông minh",
    pageDesc:
      "Công cụ quản trị hiện đại dành riêng cho Admin, tích hợp các tính năng thông minh giúp theo dõi, phân tích và tối ưu hóa trải nghiệm người dùng trên hệ sinh thái Max HUB.",
    tabLogin: "ĐĂNG NHẬP",
    tabRegister: "ĐĂNG KÝ",
    account: "Tài khoản",
    password: "Mật khẩu",
    captcha: "Mã xác nhận",
    captchaPlaceholder: "Nhập mã xác nhận",
    captchaLoading: "Tải...",
    name: "Họ tên",
    emailOptional: "Email (tùy chọn)",
    accountPlaceholder: "Tài khoản (chữ cái, số, _)",
    confirmPasswordPlaceholder: "Xác nhận mật khẩu",
    rememberPassword: "Ghi nhớ mật khẩu",
    loginBtn: "Đăng nhập",
    loginLoading: "Đang đăng nhập...",
    registerBtn: "Đăng ký",
    registerLoading: "Đang đăng ký...",
    loginWith: "Đăng nhập bằng",
    noAccount: "Chưa có tài khoản?",
    register: "Đăng ký",
    hasAccount: "Đã có tài khoản?",
    login: "Đăng nhập",
    // Validation
    enterAccountPassword: "Vui lòng nhập tài khoản và mật khẩu",
    enterCaptcha: "Vui lòng nhập mã xác nhận",
    loginSuccess: "Đăng nhập thành công!",
    loginFailed: "Đăng nhập thất bại",
    enterAccount: "Vui lòng nhập tài khoản",
    accountAlphanumeric: "Tài khoản chỉ được chứa chữ cái, số và _",
    accountMinLength: "Tài khoản phải có ít nhất 4 ký tự",
    enterName: "Vui lòng nhập họ tên",
    enterPassword: "Vui lòng nhập mật khẩu",
    registerSuccess: "Đăng ký thành công!",
    registerFailed: "Đăng ký thất bại",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NAVIGATION & MENU
  // ═══════════════════════════════════════════════════════════════════════════
  menu: {
    home: "Trang chủ",
    analytics: "Thống kê & Phân tích",
    analyticsFinance: "Phân tích Nạp/Rút",
    analyticsBetting: "Phân tích Cược",
    analyticsMembers: "Phân tích Hội viên",
    analyticsAgents: "Hiệu suất Agent",
    analyticsRevenue: "Doanh thu",
    oldCustomers: "Khách hàng",
    member: "Quản lí hội viên thuộc cấp",
    userList: "Danh sách hội viên",
    invite: "Mã giới thiệu",
    inviteList: "Danh sách mã giới thiệu",
    report: "Báo cáo",
    reportLottery: "Báo cáo xổ số",
    reportFunds: "Sao kê giao dịch",
    reportThirdGame: "Báo cáo nhà cung cấp",
    commission: "Rút hoa hồng",
    bankList: "Danh sách thẻ ngân hàng",
    deposit: "Danh sách nạp tiền",
    withdrawalsRecord: "Lịch sử rút tiền",
    withdraw: "Rút tiền",
    bet: "Quản lí đơn cược",
    betList: "Danh sách đơn cược",
    betOrder: "Đơn cược bên thứ 3",
    customer: "Thông tin khách hàng",
    editPassword: "Đổi mật khẩu đăng nhập",
    editFundPassword: "Đổi mật khẩu giao dịch",
    rebate: "Quản lí tỉ lệ hoàn trả",
    rebateOdds: "Danh sách tỉ lệ hoàn trả",
    system: "SYSTEM",
    systemUsers: "Quản lý người dùng",
    systemRoles: "Quản lý vai trò",
    syncDashboard: "Theo dõi đồng bộ",
    syncV2: "Sync V2",
    profile: "Thông Tin Tài Khoản",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADER NAV
  // ═══════════════════════════════════════════════════════════════════════════
  nav: {
    profile: "Thông Tin",
    settings: "Cài Đặt",
    logout: "Đăng xuất",
    settingsWip: "Tính năng đang phát triển",
    expand: "Mở rộng",
    collapse: "Kéo sang bên",
    refresh: "Làm mới trang",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TABS
  // ═══════════════════════════════════════════════════════════════════════════
  tabs: {
    closeCurrent: "Đóng trang hiện đang đánh dấu",
    closeOthers: "Đóng trang đánh dấu khác",
    closeAll: "Đóng toàn bộ trang đánh dấu",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 404 PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  notFound: {
    title: "Trang không tồn tại",
    routeTitle: "Không tìm thấy trang",
    backHome: "Về trang chủ",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════
  dashboard: {
    justUpdated: "Vừa cập nhật",
    secondsAgo: "s trước",
    minutesAgo: "p trước",
    // KPI comparison
    vsYesterday: "so với hôm qua",
    vsDayBefore: "so với hôm kia",
    vsLastWeek: "so với tuần trước",
    vsLastMonth: "so với tháng trước",
    vsMonthBefore: "so với tháng trước nữa",
    vsPrevDays: "so với {n} ngày trước đó",
    vsPrevPeriod: "so với kỳ trước",
    // Activity
    activityNew: "Khách mới",
    activityLost: "Mất khách",
    activityBigDeposit: "Nạp lớn",
    activityBigWithdraw: "Rút lớn",
    // Charts
    chartDeposit: "Nạp tiền",
    chartWithdrawal: "Rút tiền",
    chartPlatformShare: "Tỉ trọng nền tảng 3rd Party",
    chartLotteryShare: "Tỉ trọng Xổ Số",
    // Sections
    agentOverview: "Tổng quan Agent",
    recentActivity: "Hoạt động gần đây",
    quickInfo: "Thông tin nhanh",
    // Agent table
    memberOnline: "HỘI VIÊN ONLINE",
    todayLabel: "HÔM NAY",
    exploitation: "Khai thác",
    betLottery: "Cược XS",
    betThird: "Cược 3rd",
    depositLabel: "Nạp",
    monthTotal: "TỔNG THÁNG",
    winLose: "Thắng/Thua",
    // Info
    lastLogin: "Đăng nhập lần cuối",
    loginIp: "IP đăng nhập",
    totalAgent: "Tổng Agent",
    activeAgent: "Đang hoạt động",
    errorAgent: "Lỗi",
    offlineAgent: "Offline",
    // Dialogs
    dashboardSettings: "Cài đặt Dashboard",
    memberDetail: "Chi tiết hội viên",
    onlineMembers: "HV online — {agentName} — {date}",
    // Settings
    pollInterval: "Thời gian polling (giây)",
    bigDepositThreshold: "Ngưỡng nạp lớn (VND)",
    bigWithdrawThreshold: "Ngưỡng rút lớn (VND)",
    pollHint: "0 = tắt tự động cập nhật",
    bigDepositHint: "Hiển thị khi nạp >= số tiền này",
    bigWithdrawHint: "Hiển thị khi rút >= số tiền này",
    settingsSaved: "Đã lưu cài đặt",
    settingsError: "Lỗi lưu cài đặt",
    // Member detail
    memberType: "Loại",
    memberParent: "Cấp trên",
    memberStatus: "Trạng thái",
    memberBalance: "Số dư",
    memberTotalDeposit: "Tổng nạp",
    memberTotalWithdraw: "Tổng rút",
    memberRegisterTime: "Đăng ký",
    memberLastLogin: "Đăng nhập cuối",
    memberSyncTime: "Đồng bộ lần cuối",
    // Empty states
    loadingDashboard: "Đang tải...",
    noActivity: "Không có hoạt động nào trong 24h qua",
    noOnlineMembers: "Không có hội viên online",
    totalMembers: "Tổng: {n} hội viên",
    errorLoadDashboard: "Lỗi tải dữ liệu dashboard",
    errorLoadMembers: "Lỗi tải danh sách hội viên",
    memberNotFound: "Không tìm thấy hội viên",
    // Units
    unitOrders: "đơn",
    unitCustomers: "khách",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WELCOME PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  welcome: {
    greeting: "Chào mừng bạn đăng nhập hệ thống quản lí",
    basicInfo: "Thông tin cơ bản",
    fundOverview: "Tổng quan quỹ tiền",
    lastLoginTime: "Thời gian lần đăng nhập trước：",
    lastLoginIp: "IP lần đăng nhập trước：",
    currentLoginTime: "Thời gian lần đăng nhập này：",
    currentLoginIp: "IP lần đăng nhập này：",
    agentWallet: "Ví tiền đại lý：",
    frozenAmount: "Số tiền đóng băng：",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  profile: {
    accountInfo: "Thông tin tài khoản",
    editNamePlaceholder: "Nhập tên mới",
    account: "Tài khoản",
    email: "Email",
    emailNotSet: "Chưa cập nhật",
    status: "Trạng thái",
    lastLogin: "Đăng nhập lần cuối",
    loginIp: "IP đăng nhập",
    userId: "User ID",
    nameEmpty: "Tên không được để trống",
    nameUpdateSuccess: "Cập nhật tên thành công",
    nameUpdateFailed: "Cập nhật thất bại, vui lòng thử lại",
    // Agent settings
    agentSettings: "Cài đặt Agent (Upstream)",
    changeAgentPassword: "Đổi mật khẩu đăng nhập (Agent)",
    changeAgentPasswordDesc: "Thay đổi mật khẩu đăng nhập upstream agent",
    // System password
    changeSystemPassword: "Đổi mật khẩu hệ thống MAXHUB",
    currentPasswordPlaceholder: "Nhập mật khẩu hiện tại",
    newPasswordPlaceholder: "Nhập mật khẩu mới",
    confirmPasswordPlaceholder: "Nhập lại mật khẩu mới",
    agree: "Đồng ý",
    cancelBtn: "Huỷ bỏ",
    changePasswordSuccessLogout: "Đổi mật khẩu thành công. Đang đăng xuất...",
    // Sessions
    activeSessions: "Phiên đăng nhập đang hoạt động",
    refreshBtn: "Làm mới",
    noSessions: "Không có phiên nào",
    revokeSession: "Thu hồi",
    sessionRevoked: "Đã thu hồi phiên",
    // Security
    security: "Bảo mật",
    logoutAllDevices: "Đăng xuất tất cả thiết bị",
    logoutAllDesc: "Thu hồi tất cả phiên đăng nhập trên mọi thiết bị. Bạn sẽ cần đăng nhập lại.",
    logoutAllBtn: "Đăng xuất tất cả",
    logoutAllConfirm: "Đăng xuất tất cả thiết bị? Bạn sẽ cần đăng nhập lại.",
    logoutAllSuccess: "Đã đăng xuất tất cả thiết bị",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  notification: {
    title: "Thông báo",
    titleWithCount: "Thông báo ({n} mới)",
    all: "Tất cả",
    unread: "Chưa đọc",
    settings: "Cài đặt",
    markAllRead: "Đánh dấu tất cả đã đọc",
    deleteRead: "Xóa đã đọc",
    deleteAll: "Xóa tất cả",
    typeSettings: "Loại thông báo hiển thị",
    noNotifications: "Không có thông báo",
    memberNew: "Hội viên mới",
    memberLost: "Mất hội viên",
    agentSuffix: " - đại lý : ",
    justGot: "vừa có",
    justLost: "vừa mất",
    customer: "1 khách hàng",
    loadMore: "Xem thêm ({current}/{total})",
    // Member detail
    memberDetailTitle: "Chi tiết",
    memberDetailLoading: "Đang tải thông tin...",
    memberDetailEmpty: "Không tìm thấy dữ liệu hội viên",
    memberName: "Tên hội viên",
    memberBalance: "Số dư",
    memberType: "Loại hình",
    memberParent: "Đại lý cấp trên",
    depositCount: "Lần nạp",
    totalDeposit: "Tổng tiền nạp",
    withdrawCount: "Lần rút",
    totalWithdraw: "Tổng tiền rút",
    lastLogin: "Đăng nhập cuối",
    registerTime: "Thời gian đăng ký",
    status: "Trạng thái",
    updatedAt: "Cập nhật lúc",
    times: " lần",
    errorLoadMember: "Lỗi tải thông tin hội viên",
    memberNotFound: "Không tìm thấy thông tin hội viên",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PERMISSIONS
  // ═══════════════════════════════════════════════════════════════════════════
  permissions: {
    // Groups
    groupMember: "Hội viên",
    groupInvite: "Mã giới thiệu",
    groupReport: "Báo cáo",
    groupFinance: "Tài chính",
    groupBet: "Đơn cược",
    groupPassword: "Mật khẩu",
    groupRebate: "Hoàn trả",
    groupAnalytics: "Thống kê",
    groupSync: "Đồng bộ",
    groupSystem: "Hệ thống",
    // Labels
    usersRead: "Xem người dùng",
    usersWrite: "Tạo/sửa người dùng",
    usersDelete: "Xóa người dùng",
    rolesRead: "Xem vai trò",
    rolesWrite: "Tạo/sửa vai trò",
    rolesDelete: "Xóa vai trò",
    memberRead: "Xem hội viên",
    memberWrite: "Thêm/sửa hội viên",
    inviteRead: "Xem mã giới thiệu",
    inviteWrite: "Quản lý mã giới thiệu",
    reportRead: "Xem báo cáo",
    financeRead: "Xem tài chính",
    financeWrite: "Quản lý ngân hàng",
    betRead: "Xem đơn cược",
    passwordWrite: "Đổi mật khẩu",
    rebateRead: "Xem hoàn trả",
    analyticsRead: "Xem thống kê",
    syncRead: "Xem đồng bộ",
    syncWrite: "Quản lý đồng bộ",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // USER LIST PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  userList: {
    title: "Danh sách hội viên",
    member: "Hội viên",
    memberType: "Loại hình hội viên",
    agentAccount: "Tài khoản đại lý",
    balance: "Số dư",
    depositCount: "Lần nạp",
    withdrawCount: "Lần rút",
    totalDeposit: "Tổng tiền nạp",
    totalWithdraw: "Tổng tiền rút",
    lastLogin: "Thời gian đăng nhập cuối",
    registerTime: "Thời gian đăng ký",
    accountLabel: "Tên tài khoản:",
    accountPlaceholder: "Nhập tên tài khoản",
    registerTimeLabel: "Thời gian đăng ký:",
    statusLabel: "Trạng thái:",
    statusNormal: "Bình thường",
    statusLocked: "Đã khóa",
    sortFieldLabel: "Sắp xếp theo trường:",
    sortFieldBalance: "Số dư",
    sortFieldRegisterTime: "Thời gian đăng ký",
    sortOrderLabel: "Sắp xếp theo hướng:",
    sortDesc: "Từ lớn đến bé",
    sortAsc: "Từ bé đến lớn",
    addMember: "+ Thêm hội viên",
    addAgent: "+ Đại lý mới thêm",
    rebateSettings: "Cài đặt hoàn trả",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INVITE LIST PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  inviteList: {
    title: "Danh sách mã giới thiệu",
    inviteCode: "Mã giới thiệu",
    inviteType: "Loại hình giới thiệu",
    totalRegistered: "Tổng số đã đăng ký",
    userRegistered: "Số lượng người dùng đã đăng ký",
    depositors: "Số người nạp tiền",
    firstDayDeposit: "Nạp đầu trong ngày",
    firstDayDepositAmount: "Nạp đầu trong ngày (số tiền)",
    addedTime: "Thời gian thêm vào",
    addedTimeLabel: "Thời gian thêm vào:",
    inviteCodeLabel: "Mã giới thiệu:",
    inviteCodePlaceholder: "Nhập đầy đủ mã giới thiệu",
    addInviteCode: "+ Thêm mã giới thiệu",
    copyLink: "Copy đường link",
    viewSettings: "Xem cài đặt",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BET LIST PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  betList: {
    title: "Danh sách đơn cược",
    serialNo: "Mã giao dịch",
    userLabel: "Tên người dùng",
    betTime: "Thời gian cược",
    game: "Trò chơi",
    gameType: "Loại trò chơi",
    playType: "Cách chơi",
    period: "Kỳ",
    betInfo: "Thông tin cược",
    betAmount: "Tiền cược",
    rebateAmount: "Tiền hoàn trả",
    winLose: "Thắng thua",
    // Search
    usernamePlaceholder: "Vui lòng nhập đầy đủ Tên người dùng",
    serialNoLabel: "Mã giao dịch :",
    serialNoPlaceholder: "Nhập mã giao dịch",
    gameLabel: "Trò chơi :",
    gameTypeLabel: "Loại trò chơi :",
    playTypeLabel: "Cách chơi :",
    statusLabel: "Trạng thái :",
    // Statuses
    statusAll: "Tất cả",
    statusUnpaid: "Chưa thanh toán",
    statusWin: "Trúng",
    statusLose: "Không trúng",
    statusDraw: "Hòa",
    statusCancelUser: "Khách hủy đơn",
    statusCancelSystem: "Hệ thống hủy đơn",
    statusAbnormal: "Đơn cược bất thường",
    statusUnpaidManual: "Chưa thanh toán (khôi phục thủ công)",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BET ORDER PAGE (3rd party)
  // ═══════════════════════════════════════════════════════════════════════════
  betOrder: {
    title: "Đơn cược bên thứ 3",
    serialNo: "Mã giao dịch",
    provider: "Nhà cung cấp game bên thứ 3",
    platformUsername: "Tên tài khoản thuộc nhà cái",
    gameType: "Loại hình trò chơi",
    gameName: "Tên trò chơi bên thứ 3",
    betAmount: "Tiền cược",
    validBet: "Tiền cược hợp lệ",
    prize: "Tiền thưởng",
    winLose: "Thắng/Thua",
    betTime: "Thời gian cược",
    serialNoLabel: "Mã giao dịch :",
    serialNoPlaceholder: "Nhập mã giao dịch",
    platformUsernameLabel: "Tên tài khoản thuộc nhà cái :",
    platformUsernamePlaceholder: "Nhập tên tài khoản",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DEPOSIT LIST PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  depositList: {
    title: "Danh sách nạp tiền",
    account: "Tên tài khoản",
    agentBelong: "Thuộc đại lý",
    transactionType: "Loại hình giao dịch",
    transactionStatus: "Trạng thái giao dịch",
    accountLabel: "Tên tài khoản:",
    accountPlaceholder: "Tên tài khoản",
    typeLabel: "Loại hình giao dịch:",
    statusLabel: "Trạng thái:",
    // Types
    typeDeposit: "Nạp tiền",
    typeTransfer: "Chuyển khoản",
    // Statuses
    statusPending: "Chờ xử lý",
    statusSuccess: "Thành công",
    statusFailed: "Thất bại",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WITHDRAWALS RECORD PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  withdrawals: {
    title: "Lịch sử rút tiền",
    serialNo: "Mã giao dịch",
    createdTime: "Thời gian tạo đơn",
    account: "Tên tài khoản",
    agentBelong: "Thuộc đại lý",
    requestAmount: "Số tiền yêu cầu",
    fee: "Phí rút",
    actualAmount: "Số tiền thực nhận",
    accountLabel: "Tên tài khoản:",
    accountPlaceholder: "Tên tài khoản",
    serialNoLabel: "Mã giao dịch:",
    serialNoPlaceholder: "Mã giao dịch",
    statusLabel: "Trạng thái:",
    // Statuses
    statusPending: "Chờ xử lý",
    statusSuccess: "Thành công",
    statusFailed: "Thất bại",
    statusCancelled: "Đã hủy",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REPORT FUNDS PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  reportFunds: {
    title: "Sao kê giao dịch",
    account: "Tên tài khoản",
    agentBelong: "Thuộc đại lý",
    depositCount: "Số lần nạp",
    depositAmount: "Số tiền nạp",
    withdrawCount: "Số lần rút",
    withdrawAmount: "Số tiền rút",
    serviceFee: "Phí dịch vụ",
    agentCommission: "Hoa hồng đại lý",
    promotion: "Ưu đãi",
    thirdPartyRebate: "Hoàn trả bên thứ 3",
    thirdPartyBonus: "Tiền thưởng từ bên thứ 3",
    accountLabel: "Tên tài khoản :",
    accountPlaceholder: "Nhập tên tài khoản",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REPORT LOTTERY PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  reportLottery: {
    title: "Báo cáo xổ số",
    account: "Tên tài khoản",
    agentBelong: "Thuộc đại lý",
    betCount: "Số lần cược",
    betAmount: "Tiền cược",
    validBet: "Tiền cược hợp lệ (trừ cược hoà)",
    rebate: "Hoàn trả",
    winLose: "Thắng thua",
    winLoseNoRebate: "Kết quả thắng thua (không gồm hoàn trả)",
    prizeAmount: "Tiền trúng",
    lotteryName: "Tên loại xổ",
    bettorsCount: "Số khách đặt cược",
    lotteryNameLabel: "Tên loại xổ :",
    accountLabel: "Tên tài khoản :",
    accountPlaceholder: "Nhập tên tài khoản",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REPORT THIRD GAME PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  reportThirdGame: {
    title: "Báo cáo nhà cung cấp",
    account: "Tên tài khoản",
    provider: "Nhà cung cấp game",
    betCount: "Số lần cược",
    betAmount: "Tiền cược",
    validBet: "Tiền cược hợp lệ",
    prize: "Tiền thưởng",
    winLose: "Thắng thua",
    bettorsCount: "Số khách đặt cược",
    providerLabel: "Nhà cung cấp :",
    accountLabel: "Tên tài khoản :",
    accountPlaceholder: "Nhập tên tài khoản",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BANK LIST PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  bankList: {
    title: "Danh sách thẻ ngân hàng",
    code: "Mã số",
    isDefault: "Có cài đặt mặc định không",
    bankName: "Tên ngân hàng",
    branch: "Chi nhánh",
    accountNumber: "Số tài khoản",
    accountHolder: "Tên chủ tài khoản",
    accountLabel: "Số tài khoản:",
    accountPlaceholder: "Số tài khoản",
    addBank: "+ Thêm tài khoản ngân hàng",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REBATE ODDS PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  rebateOdds: {
    title: "Danh sách tỉ lệ hoàn trả",
    playType: "Kiểu chơi",
    rebate: "Hoàn trả",
    lotteryLabel: "Chọn loại xổ :",
    errorLoadLottery: "Lỗi tải danh sách xổ số",
    errorLoadType: "Lỗi tải loại xổ số",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EDIT PASSWORD PAGES
  // ═══════════════════════════════════════════════════════════════════════════
  editPassword: {
    agentLogin: "Đổi mật khẩu đăng nhập (Agent)",
    agentFund: "Đổi mật khẩu giao dịch (Agent)",
    fundOldLabel: "Mật khẩu giao dịch cũ",
    fundOldPlaceholder: "Bạn vẫn chưa cài đặt mật khẩu giao dịch",
    fundConfirmLabel: "Xác nhận",
    fundOldValidation: "Vui lòng nhập mật khẩu giao dịch cũ",
    fundSuccess: "Đổi mật khẩu giao dịch thành công",
    selectAgent: "Vui lòng chọn agent",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WITHDRAW PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  withdrawPage: {
    title: "Rút tiền",
    currentBalance: "Số dư hiện tại:",
    instruction:
      "Vui lòng đi tới danh sách ngân hàng, sau khi thêm tài khoản ngân hàng quý khách mới có thể thực hiện rút tiền",
    goToPage: "Đi tới trang",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SYSTEM USERS PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  systemUsers: {
    title: "Quản lý người dùng",
    username: "Tài khoản",
    name: "Tên",
    role: "Vai trò",
    createdAt: "Ngày tạo",
    searchPlaceholder: "Tài khoản hoặc tên",
    addNew: "Thêm mới",
    editUser: "Sửa người dùng",
    addUser: "Thêm người dùng",
    lock: "Khóa",
    unlock: "Mở khóa",
    active: "Hoạt động",
    locked: "Đã khóa",
    confirmDelete: "Bạn có chắc muốn xóa người dùng này?",
    usernamePlaceholder: "Nhập tài khoản (chữ cái, số, _)",
    passwordPlaceholder: "Nhập mật khẩu (tối thiểu 8 ký tự)",
    namePlaceholder: "Nhập tên người dùng",
    selectRole: "Chọn vai trò",
    enterUsername: "Vui lòng nhập tài khoản",
    usernameRule: "Tài khoản ít nhất 4 ký tự, chỉ chữ cái, số và _",
    enterPassword: "Vui lòng nhập mật khẩu",
    passwordMinLength: "Mật khẩu phải có ít nhất 8 ký tự",
    enterName: "Vui lòng nhập tên",
    selectRoleRequired: "Vui lòng chọn vai trò",
    updateSuccess: "Cập nhật thành công",
    createSuccess: "Tạo thành công",
    lockedSuccess: "Đã khóa tài khoản",
    unlockedSuccess: "Đã mở khóa tài khoản",
    deleteSuccess: "Xóa thành công",
    deleteFailed: "Xóa thất bại",
    emailOptional: "Email (không bắt buộc)",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SYSTEM ROLES PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  systemRoles: {
    title: "Quản lý vai trò",
    name: "Tên",
    type: "Loại",
    level: "Cấp độ",
    permissionsCol: "Quyền hạn",
    editRole: "Sửa vai trò",
    addRole: "Thêm vai trò",
    addNew: "Thêm mới",
    assignPermissions: "Phân quyền",
    permissionsTitle: "Phân quyền — {name}",
    allPermissions: "Toàn quyền",
    rolePlaceholder: "Nhập tên vai trò",
    selectType: "Chọn loại",
    confirmDelete: "Bạn có chắc muốn xóa vai trò này?",
    enterName: "Vui lòng nhập tên vai trò",
    selectTypeRequired: "Vui lòng chọn loại",
    updateSuccess: "Cập nhật thành công",
    createSuccess: "Tạo thành công",
    savePermissions: "Lưu quyền hạn",
    permissionsUpdateSuccess: "Cập nhật quyền hạn thành công",
    deleteSuccess: "Xóa thành công",
    deleteFailed: "Xóa thất bại",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SYNC DASHBOARD PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  sync: {
    // Endpoint labels
    endpointUsers: "Hội viên",
    endpointDeposit: "Nạp tiền",
    endpointWithdraw: "Rút tiền",
    endpointBetLottery: "Đơn cược xổ số",
    endpointBetThird: "Đơn cược bên thứ 3",
    endpointReportLottery: "Báo cáo xổ số",
    endpointReportFunds: "Sao kê giao dịch",
    endpointReportThird: "Báo cáo NCC",
    // Status
    statusActive: "Hoạt động",
    statusLogging: "Đang login...",
    statusOffline: "Offline",
    statusError: "Lỗi",
    statusDisabled: "Tắt",
    statusExpired: "Cookie hết hạn",
    statusChecking: "Kiểm tra...",
    // Overview
    overviewStatus: "Trạng thái",
    syncing: "Đang đồng bộ...",
    ready: "Sẵn sàng",
    totalRecords: "Tổng bản ghi",
    activeAgents: "Agent hoạt động",
    syncCycle: "Chu kỳ đồng bộ",
    customize: "Tuỳ chỉnh",
    // Agent table
    agentStatus: "Trạng thái đại lý",
    colAgentData: "Đại lý / Dữ liệu",
    colAccount: "Tài khoản",
    colRecords: "Bản ghi",
    colLastSync: "Sync cuối",
    // Toolbar
    addAgent: "Thêm đại lý",
    loginAll: "Login tất cả",
    syncAll: "Đồng bộ",
    stopSync: "Dừng",
    autoSyncOn: "Tự động: BẬT",
    autoSyncOff: "Tự động: TẮT",
    autoSyncEnabled: "Đã bật đồng bộ tự động",
    autoSyncDisabled: "Đã tắt đồng bộ tự động",
    autoSyncError: "Lỗi thay đổi trạng thái đồng bộ tự động",
    // Dropdown
    editInfo: "Sửa thông tin",
    loggingIn: "Đang login...",
    loginEE88: "Login EE88",
    loggingOut: "Đang logout...",
    logoutEE88: "Logout EE88",
    changePassword: "Đổi mật khẩu",
    deleteData: "Xóa dữ liệu",
    disable: "Vô hiệu hoá",
    // Agent modal
    addAgentTitle: "Thêm đại lý",
    editAgentTitle: "Sửa đại lý: {name}",
    agentName: "Tên đại lý",
    agentNamePlaceholder: "VD: Agent 01",
    usernameEE88: "Username EE88",
    usernameEE88Placeholder: "Tài khoản ee88",
    passwordNew: "Mật khẩu mới",
    passwordEE88: "Mật khẩu EE88",
    passwordNewPlaceholder: "Để trống nếu không đổi",
    passwordEE88Placeholder: "Mật khẩu ee88",
    baseUrl: "Base URL",
    baseUrlPlaceholder: "Mặc định nếu để trống",
    // Password modal
    changePasswordTitle: "Đổi mật khẩu: {name}",
    oldPasswordPlaceholder: "Nhập mật khẩu cũ đại lý EE88",
    newPasswordPlaceholder: "Mật khẩu mới (tối thiểu 6 ký tự)",
    confirmPasswordPlaceholder: "Xác nhận mật khẩu mới",
    changingPassword: "Đang lưu...",
    // Sync interval modal
    syncIntervalTitle: "Cài đặt chu kỳ đồng bộ",
    syncIntervalDesc: "Cài đặt chu kỳ đồng bộ riêng cho từng loại dữ liệu (phút). Tối thiểu 1 phút.",
    dataType: "Loại dữ liệu",
    cycleMinutes: "Chu kỳ (phút)",
    saving: "Đang lưu...",
    saveAll: "Lưu tất cả",
    // Confirm dialogs
    confirmDisable: "Bạn có chắc muốn **vô hiệu hoá** đại lý **{name}**?",
    confirmDisableTitle: "Xác nhận vô hiệu hoá",
    confirmDisableBtn: "Vô hiệu hoá",
    confirmDeleteAll: "Bạn có chắc muốn **xóa TẤT CẢ** dữ liệu đồng bộ?\nHành động này không thể hoàn tác.",
    confirmDeleteAllTitle: "Xác nhận xóa tất cả",
    confirmDeleteAllBtn: "Xóa tất cả",
    confirmDeleteAgent:
      "Bạn có chắc muốn **xóa dữ liệu** của đại lý **{name}**?\nHành động này không thể hoàn tác.",
    confirmDeleteAgentTitle: "Xác nhận xóa dữ liệu đại lý",
    // Toast messages
    enterAgentName: "Vui lòng nhập tên đại lý",
    agentUpdated: "Đã cập nhật đại lý",
    usernamePasswordRequired: "Username và Password ee88 là bắt buộc",
    agentCreated: "Đã tạo đại lý mới",
    agentSaveError: "Lỗi lưu đại lý",
    enterOldPassword: "Vui lòng nhập mật khẩu cũ",
    passwordMinLength: "Mật khẩu mới tối thiểu 6 ký tự",
    passwordMismatch: "Xác nhận mật khẩu không khớp",
    passwordChangeSuccess: "Đổi mật khẩu thành công",
    passwordChangeError: "Lỗi đổi mật khẩu",
    syncAllTriggered: "Đã kích hoạt đồng bộ tất cả",
    syncAllError: "Lỗi khi kích hoạt đồng bộ",
    syncStopRequested: "Đã yêu cầu dừng đồng bộ",
    syncStopError: "Lỗi khi dừng đồng bộ",
    intervalMin: "{label}: tối thiểu 1 phút",
    intervalUpdated: "Đã cập nhật chu kỳ đồng bộ",
    intervalUpdateError: "Lỗi cập nhật chu kỳ đồng bộ",
    syncAgentTriggered: "Đã kích hoạt đồng bộ đại lý",
    syncAgentError: "Lỗi khi kích hoạt đồng bộ đại lý",
    syncEndpointTriggered: "Đã kích hoạt đồng bộ {label}",
    syncEndpointError: "Lỗi khi kích hoạt đồng bộ",
    deleteAllSuccess: "Đã xóa tất cả dữ liệu",
    deleteAllError: "Lỗi khi xóa dữ liệu",
    deleteAgentSuccess: "Đã xóa dữ liệu đại lý",
    deleteAgentError: "Lỗi khi xóa dữ liệu đại lý",
    loginSuccess: "Đăng nhập thành công",
    loginError: "Lỗi đăng nhập",
    loginAgentError: "Lỗi đăng nhập agent",
    logoutSuccess: "Đã logout agent",
    logoutError: "Lỗi logout",
    logoutAgentError: "Lỗi logout agent",
    loginAllResult: "Đã login {success}/{total} agents",
    loginAllError: "Lỗi login tất cả",
    disabledSuccess: "Đã vô hiệu hoá đại lý",
    disabledError: "Lỗi xóa đại lý",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SYNC V2 PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  syncV2: {
    title: "Sync V2",
    agentCol: "Nhân viên - Đại lý",
    stopSync: "Dừng Sync",
    errorLoadAgents: "Lỗi tải danh sách đại lý",
    stopRequested: "Đã yêu cầu dừng đồng bộ",
    noSyncRunning: "Không có sync đang chạy",
    stopError: "Lỗi khi dừng đồng bộ",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS — FINANCE
  // ═══════════════════════════════════════════════════════════════════════════
  analyticsFinance: {
    title: "Phân tích Nạp / Rút",
    trendTitle: "Xu hướng Nạp / Rút / Lãi ròng",
    depositByAgent: "Nạp tiền theo Agent",
    withdrawByAgent: "Rút tiền theo Agent",
    feesCommissions: "Phí & Hoa hồng & Khuyến mãi",
    depositStatus: "Trạng thái Nạp tiền",
    withdrawStatus: "Trạng thái Rút tiền",
    topDeposit: "Top 10 Nạp nhiều nhất",
    topWithdraw: "Top 10 Rút nhiều nhất",
    deposit: "Nạp tiền",
    withdrawal: "Rút tiền",
    netProfit: "Lãi ròng",
    transactionFee: "Phí giao dịch",
    commission: "Hoa hồng",
    promotionLabel: "Khuyến mãi",
    thirdPartyRebate: "Hoàn trả 3rd",
    rank: "#",
    agent: "Agent",
    totalDeposit: "Tổng nạp",
    totalWithdraw: "Tổng rút",
    orderCount: "Số đơn",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS — BETTING
  // ═══════════════════════════════════════════════════════════════════════════
  analyticsBetting: {
    title: "Phân tích Cược",
    totalBetLottery: "Tổng cược Xổ Số",
    totalBetThird: "Tổng cược 3rd Party",
    totalProfit: "Tổng lợi nhuận",
    lotteryTypes: "Số loại Xổ Số",
    orders: "đơn",
    plays: "lượt",
    thirdPlatforms: "nền tảng 3rd",
    lotteryTrend: "Xu hướng cược Xổ Số",
    thirdTrend: "Xu hướng cược 3rd Party",
    profitByDay: "Lợi nhuận theo ngày (Xổ Số + 3rd Party)",
    betByLottery: "Cược theo loại Xổ Số",
    platformShare: "Tỉ trọng nền tảng 3rd Party",
    platformRanking: "Xếp hạng nền tảng 3rd Party",
    topBettors: "Top 10 cược nhiều nhất (Xổ Số)",
    bet: "Cược",
    betThird: "Cược 3rd",
    profitLottery: "Lợi nhuận Xổ Số",
    profitThird: "Lợi nhuận 3rd Party",
    total: "Tổng",
    rank: "#",
    platform: "Nền tảng",
    revenue: "Doanh thu",
    totalBet: "Tổng cược",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS — MEMBERS
  // ═══════════════════════════════════════════════════════════════════════════
  analyticsMembers: {
    title: "Phân tích Hội viên",
    totalMembers: "Tổng hội viên",
    newMembers30d: "Khách mới (30 ngày)",
    lostMembers30d: "Khách mất (30 ngày)",
    net30d: "Ròng (30 ngày)",
    byAgent: "Phân bổ theo Agent",
    memberStatus: "Trạng thái hội viên",
    memberType: "Phân loại hội viên",
    trend30d: "Xu hướng Khách mới / Khách mất (30 ngày)",
    registerByMonth: "Đăng ký theo tháng",
    topBalance: "Top 10 số dư cao nhất",
    topDeposit: "Top 10 nạp nhiều nhất (tích lũy)",
    members: "Hội viên",
    newMembers: "Khách mới",
    lostMembers: "Khách mất",
    net: "Ròng",
    register: "Đăng ký",
    rank: "#",
    agent: "Agent",
    balance: "Số dư",
    totalDeposit: "Tổng nạp",
    depositCount: "Lần nạp",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS — AGENTS
  // ═══════════════════════════════════════════════════════════════════════════
  analyticsAgents: {
    title: "Hiệu suất Agent",
    totalAgents: "Tổng Agent",
    totalDeposit: "Tổng nạp ({days}d)",
    totalCommission: "Tổng hoa hồng",
    totalMembers: "Tổng hội viên",
    compareTitle: "So sánh Agent: Nạp / Rút / Cược",
    depositTrend: "Xu hướng nạp tiền theo Agent (7 ngày gần nhất)",
    commissionByDay: "Hoa hồng & Khuyến mãi theo ngày",
    loginHistory: "Lịch sử đăng nhập Agent",
    agentDetail: "Chi tiết Agent",
    loginDetail: "Chi tiết đăng nhập Agent",
    deposit: "Nạp",
    withdraw: "Rút",
    betLottery: "Cược XS",
    betThird: "Cược 3rd",
    commission: "Hoa hồng",
    promotion: "Khuyến mãi",
    success: "Thành công",
    failed: "Thất bại",
    // Detail table
    agentCol: "Agent",
    statusCol: "Status",
    memberCount: "Hội viên",
    totalDepositCol: "Tổng Nạp",
    totalWithdrawCol: "Tổng Rút",
    betLotteryCol: "Cược XS",
    wlLotteryCol: "W/L XS",
    betThirdCol: "Cược 3rd",
    wlThirdCol: "W/L 3rd",
    commissionCol: "Hoa hồng",
    // Login detail table
    successCount: "Thành công",
    failedCount: "Thất bại",
    avgCaptcha: "Captcha TB",
    lastLoginCol: "Đăng nhập cuối",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS — REVENUE (Doanh thu)
  // ═══════════════════════════════════════════════════════════════════════════
  analyticsRevenue: {
    title: "Báo cáo Doanh thu",
    summaryTable: "Tổng quát doanh thu theo nhân viên",
    employeeName: "Tên nhân viên",
    lotteryProfit: "Lợi nhuận XS",
    thirdGameProfit: "Lợi nhuận NCC",
    promotionCol: "Ưu đãi",
    rebateCol: "Hoàn trả",
    totalRevenue: "Tổng doanh thu",
    customerCountCol: "Số KH",
    grandTotal: "TỔNG CỘNG",
    totalCustomers: "Tổng khách hàng",
    uploadCustomers: "Upload KH",
    exportXlsx: "Xuất XLSX",
    noCustomerData: "Chưa có dữ liệu nhân viên — khách hàng. Vui lòng upload file Excel.",
    uploadSuccess: "Upload thành công: {employees} nhân viên, {mappings} liên kết",
    uploadError: "Lỗi upload file",
    exportSuccess: "Xuất file thành công",
    exportError: "Lỗi xuất file",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // OLD CUSTOMERS (Khách hàng cũ)
  // ═══════════════════════════════════════════════════════════════════════════
  oldCustomers: {
    title: "Khách hàng",
    upload: "Upload KH",
    totalCustomers: "Tổng khách hàng",
    totalEmployees: "Nhân viên",
    totalAgents: "Đại lý",
    totalSources: "Nguồn",
    filterEmployee: "Nhân viên",
    filterAgent: "Đại lý",
    searchPlaceholder: "Tìm tài khoản, liên hệ...",
    noData: "Chưa có dữ liệu khách hàng cũ. Vui lòng upload file Excel.",
    listTitle: "Danh sách khách hàng",
    records: "bản ghi",
    colDate: "Ngày",
    colEmployee: "Nhân viên",
    colAgent: "Đại lý",
    colUsername: "Tài khoản",
    colContact: "Liên hệ",
    colSource: "Nguồn",
    colReferral: "TK giới thiệu",
    colFirstDeposit: "Nạp đầu",
    uploadSuccess: "Upload thành công: {customers} KH, {employees} NV",
    uploadError: "Lỗi upload file",
    exportXlsx: "Xuất XLSX",
    exportSuccess: "Xuất file thành công",
    exportError: "Lỗi xuất file",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTE CUSTOMER (thêm KH từ text paste)
  // ═══════════════════════════════════════════════════════════════════════════
  noteCustomer: {
    btn: "Note Khách",
    title: "Note Khách Hàng",
    pasteLabel: "Dán dữ liệu",
    pastePlaceholder: "Paste nội dung từ Telegram/Zalo vào đây...",
    parseBtn: "Nhận diện",
    previewLabel: "Xem trước",
    clearAll: "Xóa tất cả",
    emptyInput: "Vui lòng dán dữ liệu vào ô bên trái",
    parseError: "Không nhận diện được dữ liệu. Vui lòng kiểm tra định dạng.",
    parseSuccess: "Đã nhận diện {count} khách hàng",
    emptyPreview: 'Dán dữ liệu bên trái rồi bấm "Nhận diện"',
    noData: "Chưa có dữ liệu để thêm",
    addBtn: "Thêm vào danh sách",
    addRow: "Thêm dòng",
    missingUsername: "Dòng {row} chưa có tài khoản (username)",
    addSuccess: "Đã thêm {inserted} khách hàng, bỏ qua {skipped} trùng",
    addError: "Lỗi thêm khách hàng",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PERMISSION TREE (role assignment UI)
  // ═══════════════════════════════════════════════════════════════════════════
  permTree: {
    memberGroup: "Hội viên",
    memberList: "Xem hội viên",
    memberWrite: "Thêm/sửa hội viên",
    inviteGroup: "Mã giới thiệu",
    inviteList: "Xem mã giới thiệu",
    inviteWrite: "Quản lý mã giới thiệu",
    reportGroup: "Báo cáo",
    reportRead: "Xem báo cáo",
    commissionGroup: "Tài chính",
    financeRead: "Xem tài chính",
    financeWrite: "Quản lý ngân hàng",
    betGroup: "Đơn cược",
    betRead: "Xem đơn cược",
    customerGroup: "Thông tin khách hàng",
    passwordWrite: "Đổi mật khẩu",
    rebateGroup: "Hoàn trả",
    rebateRead: "Xem hoàn trả",
    systemGroup: "Hệ thống",
    usersRead: "Xem người dùng",
    usersWrite: "Tạo/sửa người dùng",
    usersDelete: "Xóa người dùng",
    rolesRead: "Xem vai trò",
    rolesWrite: "Tạo/sửa vai trò",
    rolesDelete: "Xóa vai trò",
    syncRead: "Xem đồng bộ",
    syncWrite: "Quản lý đồng bộ",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PLAY TYPES (lottery bet types)
  // ═══════════════════════════════════════════════════════════════════════════
  playType: {
    lo2so: "Lô 2 Số",
    lo2so1k: "Lô 2 Số 1K",
    lo3so: "Lô 3 Số",
    lo4so: "Lô 4 Số",
    xien2: "Xiên 2",
    xien3: "Xiên 3",
    xien4: "Xiên 4",
    deDau: "Đề đầu",
    deDacBiet: "Đề đặc biệt",
    deDauDuoi: "Đề đầu đuôi",
    dau: "Đầu",
    duoi: "Đuôi",
    cang3Dau: "3 Càng đầu",
    cang3DacBiet: "3 Càng đặc biệt",
    cang3DauDuoi: "3 Càng đầu đuôi",
    cang4DacBiet: "4 Càng đặc biệt",
    truotXien4: "Trượt xiên 4",
    truotXien8: "Trượt xiên 8",
    truotXien10: "Trượt xiên 10",
    keoDoi: "Kéo đôi",
    tong0: "Tổng 0",
    tong1: "Tổng 1",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LOTTERY NAMES (game names)
  // ═══════════════════════════════════════════════════════════════════════════
  lottery: {
    // Sicbo
    sicbo30s: "Sicbo 30 giây",
    sicbo20s: "Sicbo 20 giây",
    sicbo40s: "Sicbo 40 giây",
    sicbo50s: "Sicbo 50 giây",
    sicbo1m: "Sicbo 1 phút",
    sicbo1m30s: "Sicbo 1.5 phút",
    // Miền Bắc
    mienBac: "Miền Bắc",
    mBacNhanh3m: "M.bắc nhanh 3 phút",
    mBacNhanh5m: "M.bắc nhanh 5 phút",
    mBacVip45s: "Miền Bắc VIP 45 giây",
    mBacVip75s: "Miền Bắc VIP 75 giây",
    mBacVip2m: "Miền Bắc VIP 2 phút",
    xsMienBac: "Xổ số Miền Bắc",
    // Keno
    kenoVip20s: "Keno VIP 20 giây",
    kenoVip30s: "Keno VIP 30 giây",
    kenoVip40s: "Keno VIP 40 giây",
    kenoVip50s: "Keno VIP 50 giây",
    kenoVip1m: "Keno VIP 1 phút",
    kenoVip5m: "Keno VIP 5 phút",
    // Win Go
    winGo45s: "Win go 45 giây",
    winGo1m: "Win go 1 phút",
    winGo3m: "Win go 3 phút",
    winGo5m: "Win go 5 phút",
    winGo30s: "Win go 30 giây",
    // Miền Nam (tỉnh)
    bacLieu: "Bạc Liêu",
    vungTau: "Vũng Tàu",
    tienGiang: "Tiền Giang",
    kienGiang: "Kiên Giang",
    daLat: "Đà Lạt",
    binhPhuoc: "Bình Phước",
    binhDuong: "Bình Dương",
    anGiang: "An Giang",
    binhThuan: "Bình Thuận",
    caMau: "Cà Mau",
    canTho: "Cần Thơ",
    hauGiang: "Hậu Giang",
    dongThap: "Đồng Tháp",
    tayNinh: "Tây Ninh",
    socTrang: "Sóc Trăng",
    tpHCM: "TP Hồ Chí Minh",
    dongNai: "Đồng Nai",
    traVinh: "Trà Vinh",
    vinhLong: "Vĩnh Long",
    // Miền Nam VIP
    mNamVip5m: "Miền Nam VIP 5 phút",
    mNamVip45s: "Miền Nam VIP 45 giây",
    mNamVip1m: "Miền Nam VIP 1 phút",
    mNamVip90s: "Miền Nam VIP 90 giây",
    mNamVip2m: "Miền Nam VIP 2 phút",
    // Miền Trung
    daNang: "Đà Nẵng",
    thuaThienHue: "Thừa Thiên Huế",
    quangTri: "Quảng Trị",
    phuYen: "Phú Yên",
    quangBinh: "Quảng Bình",
    quangNam: "Quảng Nam",
    quangNgai: "Quảng Ngãi",
    ninhThuan: "Ninh Thuận",
    konTum: "Kon Tum",
    khanhHoa: "Khánh Hoà",
    giaLai: "Gia Lai",
    binhDinh: "Bình Định",
    dakLak: "Đắk Lắk",
    dakNong: "Đắk Nông",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT DIALOG
  // ═══════════════════════════════════════════════════════════════════════════
  exportDialog: {
    title: "Chọn nguồn xuất dữ liệu",
    dbLocalDesc: "Xuất từ dữ liệu đã đồng bộ, nhanh hơn.",
    ee88Desc: "Xuất trực tiếp từ nguồn, dữ liệu mới nhất nhưng chậm hơn.",
    dbLocal: "DB Local",
    ee88: "ee88",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EXCEL EXPORT (Revenue)
  // ═══════════════════════════════════════════════════════════════════════════
  excelExport: {
    monthLabel: "THÁNG {month}/{year}",
    fileName: "DoanhThu_{timestamp}.xlsx",
    sheetSummary: "TỔNG QUÁT",
    sheetDetail: "CHI TIẾT DOANH THU",
    headerNo: "序号\nSTT",
    headerEmployee: "员工姓名\nTên nhân viên",
    headerLotteryProfit: "彩票利润\nLợi nhuận XS",
    headerThirdProfit: "第三者利润\nLợi nhuận bên thứ 3",
    headerPromotion: "优惠\nƯu đãi",
    headerRebate: "第三者退款\nHoàn trả",
    headerTotalRevenue: "总营收\nTổng doanh thu",
    grandTotal: "总计\nTỔNG CỘNG",
    detailTitle: "各月利润明细\nLỢI NHUẬN CHI TIẾT THEO THÁNG",
    headerDeveloper: "开发人\nNHÂN VIÊN",
    headerTotal: "总营收\nTỔNG",
    profitLabel: "利润\nLỢI NHUẬN",
    headerDate: "日期\nNgày",
    headerTotalCustomers: "开发客户总数量\nTổng lượng khách",
    headerDailyCustomers: "今日开发客户数量\nLượng khách trong ngày",
    headerCustomerAccount: "客户账号\nTài khoản khách hàng",
    headerFirstDeposit: "首次充值\nNạp tiền lần đầu",
    headerDetailLottery: "彩票利润\nLợi nhuận xổ số",
    headerDetailThird: "第三者利润\nLợi nhuận bên thứ 3",
    headerDetailPromotion: "优惠\nƯu Đãi",
    headerDetailRebate: "第三者退款\nHoàn trả bên thứ 3",
    headerDetailTotal: "总\nTổng",
    headerWinLose: "输赢 2M\nTHẮNG THUA",
    monthlyProfit: "LỢI NHUẬN THÁNG {month}/{year}",
    grandTotalLabel: "TỔNG CỘNG",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LANGUAGE
  // ═══════════════════════════════════════════════════════════════════════════
  language: {
    vi: "Tiếng Việt",
    zh: "中文",
  },
};
