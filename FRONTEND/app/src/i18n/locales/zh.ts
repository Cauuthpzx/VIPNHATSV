export default {
  // ═══════════════════════════════════════════════════════════════════════════
  // COMMON / SHARED
  // ═══════════════════════════════════════════════════════════════════════════
  common: {
    search: "搜索",
    reset: "重置",
    save: "保存",
    cancel: "取消",
    confirm: "确认",
    delete: "删除",
    edit: "编辑",
    detail: "详情",
    create: "新建",
    update: "更新",
    close: "关闭",
    loading: "加载中...",
    noData: "暂无数据",
    actions: "操作",
    all: "全部",
    select: "请选择",
    agent: "员工",
    agentLabel: "员工：",
    username: "用户名",
    time: "时间",
    timeLabel: "时间：",
    status: "状态",
    remark: "备注",
    amount: "金额",
    dateStart: "开始日期",
    dateEnd: "结束日期",
    errorLoad: "加载数据失败",
    operationFailed: "操作失败",
    operationFailedRetry: "操作失败，请重试",
    localData: "本地数据",
    summaryData: "汇总数据",
    agentAvailable: "可用代理：",
    days: "天",
    minutesAgo: " 分钟前",
    hoursAgo: " 小时前",
    daysAgo: " 天前",
    justNow: "刚刚",
    unknown: "未知",
    online: "在线",
    yes: "是",
    no: "否",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYUI COMPONENT OVERRIDES
  // ═══════════════════════════════════════════════════════════════════════════
  page: {
    previous: "上一页",
    next: "下一页",
    goTo: "跳转到",
    confirm: "确认",
    page: "页",
    item: "条",
    total: "共",
  },
  table: {
    filter: "筛选",
    export: "导出",
    print: "打印",
  },
  input: {
    placeholder: "请输入",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DATE RANGE / QUICK SELECT
  // ═══════════════════════════════════════════════════════════════════════════
  dateRange: {
    today: "今天",
    yesterday: "昨天",
    thisWeek: "本周",
    thisMonth: "本月",
    lastMonth: "上月",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PASSWORD STRENGTH
  // ═══════════════════════════════════════════════════════════════════════════
  password: {
    minLength: "8+ 字符",
    uppercase: "大写字母 (A-Z)",
    lowercase: "小写字母 (a-z)",
    number: "数字 (0-9)",
    special: "特殊字符 (!@#...)",
    weak: "弱",
    medium: "中",
    fair: "较强",
    strong: "强",
    oldPassword: "旧密码",
    oldPasswordPlaceholder: "请输入旧密码",
    newPassword: "新密码",
    newPasswordPlaceholder: "请输入新密码",
    confirmPassword: "确认新密码",
    confirmPasswordPlaceholder: "请再次输入新密码",
    changeSuccess: "修改密码成功",
    enterOld: "请输入旧密码",
    enterNew: "请输入新密码",
    notStrong: "密码强度不足",
    mismatch: "两次密码不一致",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGIN / REGISTER
  // ═══════════════════════════════════════════════════════════════════════════
  auth: {
    pageTitle: "Max HUB Admin – 智能运营中心",
    pageDesc:
      "专为管理员打造的现代化管理工具，集成智能功能，帮助跟踪、分析和优化 Max HUB 生态系统的用户体验。",
    tabLogin: "登录",
    tabRegister: "注册",
    account: "账号",
    password: "密码",
    captcha: "验证码",
    captchaPlaceholder: "请输入验证码",
    captchaLoading: "加载中...",
    name: "姓名",
    emailOptional: "邮箱 (可选)",
    accountPlaceholder: "账号 (字母、数字、_)",
    confirmPasswordPlaceholder: "确认密码",
    rememberPassword: "记住密码",
    loginBtn: "登录",
    loginLoading: "登录中...",
    registerBtn: "注册",
    registerLoading: "注册中...",
    loginWith: "其他登录方式",
    noAccount: "没有账号？",
    register: "注册",
    hasAccount: "已有账号？",
    login: "登录",
    // Validation
    enterAccountPassword: "请输入账号和密码",
    enterCaptcha: "请输入验证码",
    loginSuccess: "登录成功！",
    loginFailed: "登录失败",
    enterAccount: "请输入账号",
    accountAlphanumeric: "账号只能包含字母、数字和_",
    accountMinLength: "账号至少4个字符",
    enterName: "请输入姓名",
    enterPassword: "请输入密码",
    registerSuccess: "注册成功！",
    registerFailed: "注册失败",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NAVIGATION & MENU
  // ═══════════════════════════════════════════════════════════════════════════
  menu: {
    home: "首页",
    analytics: "统计分析",
    analyticsFinance: "充提分析",
    analyticsBetting: "投注分析",
    analyticsMembers: "会员分析",
    analyticsAgents: "代理绩效",
    analyticsRevenue: "营收报告",
    oldCustomers: "客户",
    member: "下级会员管理",
    userList: "会员列表",
    invite: "邀请码",
    inviteList: "邀请码列表",
    report: "报表",
    reportLottery: "彩票报表",
    reportFunds: "交易明细",
    reportThirdGame: "供应商报表",
    commission: "佣金提现",
    bankList: "银行卡列表",
    deposit: "充值列表",
    withdrawalsRecord: "提现记录",
    withdraw: "提现",
    bet: "注单管理",
    betList: "注单列表",
    betOrder: "第三方注单",
    customer: "客户信息",
    editPassword: "修改登录密码",
    editFundPassword: "修改资金密码",
    rebate: "返水管理",
    rebateOdds: "返水比例列表",
    system: "系统",
    systemUsers: "用户管理",
    systemRoles: "角色管理",
    syncDashboard: "同步监控",
    syncV2: "Sync V2",
    profile: "账户信息",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADER NAV
  // ═══════════════════════════════════════════════════════════════════════════
  nav: {
    profile: "个人信息",
    settings: "设置",
    logout: "退出登录",
    settingsWip: "功能开发中",
    expand: "展开",
    collapse: "收起",
    refresh: "刷新页面",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TABS
  // ═══════════════════════════════════════════════════════════════════════════
  tabs: {
    closeCurrent: "关闭当前标签",
    closeOthers: "关闭其他标签",
    closeAll: "关闭所有标签",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 404 PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  notFound: {
    title: "页面不存在",
    routeTitle: "页面未找到",
    backHome: "返回首页",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════
  dashboard: {
    justUpdated: "刚刚更新",
    secondsAgo: "秒前",
    minutesAgo: "分钟前",
    // KPI comparison
    vsYesterday: "较昨日",
    vsDayBefore: "较前日",
    vsLastWeek: "较上周",
    vsLastMonth: "较上月",
    vsMonthBefore: "较上上月",
    vsPrevDays: "较前{n}天",
    vsPrevPeriod: "较上期",
    // Activity
    activityNew: "新客户",
    activityLost: "流失客户",
    activityBigDeposit: "大额充值",
    activityBigWithdraw: "大额提现",
    // Charts
    chartDeposit: "充值",
    chartWithdrawal: "提现",
    chartPlatformShare: "第三方平台占比",
    chartLotteryShare: "彩票占比",
    // Sections
    agentOverview: "代理总览",
    recentActivity: "最近活动",
    quickInfo: "快捷信息",
    // Agent table
    memberOnline: "在线会员",
    todayLabel: "今日",
    exploitation: "开发",
    betLottery: "彩票投注",
    betThird: "第三方投注",
    depositLabel: "充值",
    monthTotal: "本月合计",
    winLose: "盈亏",
    // Info
    lastLogin: "最后登录",
    loginIp: "登录IP",
    totalAgent: "总代理",
    activeAgent: "活跃",
    errorAgent: "异常",
    offlineAgent: "离线",
    // Dialogs
    dashboardSettings: "仪表盘设置",
    memberDetail: "会员详情",
    onlineMembers: "在线会员 — {agentName} — {date}",
    // Settings
    pollInterval: "轮询间隔（秒）",
    bigDepositThreshold: "大额充值阈值（VND）",
    bigWithdrawThreshold: "大额提现阈值（VND）",
    pollHint: "0 = 关闭自动更新",
    bigDepositHint: "充值 >= 此金额时显示",
    bigWithdrawHint: "提现 >= 此金额时显示",
    settingsSaved: "设置已保存",
    settingsError: "保存设置失败",
    // Member detail
    memberType: "类型",
    memberParent: "上级",
    memberStatus: "状态",
    memberBalance: "余额",
    memberTotalDeposit: "总充值",
    memberTotalWithdraw: "总提现",
    memberRegisterTime: "注册时间",
    memberLastLogin: "最后登录",
    memberSyncTime: "最后同步",
    // Empty states
    loadingDashboard: "加载中...",
    noActivity: "过去24小时无活动",
    noOnlineMembers: "无在线会员",
    totalMembers: "共 {n} 位会员",
    errorLoadDashboard: "加载仪表盘数据失败",
    errorLoadMembers: "加载会员列表失败",
    memberNotFound: "未找到会员",
    // Units
    unitOrders: "单",
    unitCustomers: "客",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WELCOME PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  welcome: {
    greeting: "欢迎登录管理系统",
    basicInfo: "基本信息",
    fundOverview: "资金总览",
    lastLoginTime: "上次登录时间：",
    lastLoginIp: "上次登录IP：",
    currentLoginTime: "本次登录时间：",
    currentLoginIp: "本次登录IP：",
    agentWallet: "代理钱包：",
    frozenAmount: "冻结金额：",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  profile: {
    accountInfo: "账户信息",
    editNamePlaceholder: "输入新名称",
    account: "账号",
    email: "邮箱",
    emailNotSet: "未设置",
    status: "状态",
    lastLogin: "最后登录",
    loginIp: "登录IP",
    userId: "用户ID",
    nameEmpty: "名称不能为空",
    nameUpdateSuccess: "名称更新成功",
    nameUpdateFailed: "更新失败，请重试",
    // Agent settings
    agentSettings: "代理设置 (上游)",
    changeAgentPassword: "修改登录密码 (Agent)",
    changeAgentPasswordDesc: "修改上游代理的登录密码",
    // System password
    changeSystemPassword: "修改系统密码 MAXHUB",
    currentPasswordPlaceholder: "输入当前密码",
    newPasswordPlaceholder: "输入新密码",
    confirmPasswordPlaceholder: "再次输入新密码",
    agree: "确定",
    cancelBtn: "取消",
    changePasswordSuccessLogout: "密码修改成功，正在退出...",
    // Sessions
    activeSessions: "活跃的登录会话",
    refreshBtn: "刷新",
    noSessions: "暂无会话",
    revokeSession: "撤销",
    sessionRevoked: "已撤销会话",
    // Security
    security: "安全",
    logoutAllDevices: "退出所有设备",
    logoutAllDesc: "撤销所有设备上的登录会话。您需要重新登录。",
    logoutAllBtn: "退出所有",
    logoutAllConfirm: "退出所有设备？您需要重新登录。",
    logoutAllSuccess: "已退出所有设备",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  notification: {
    title: "通知",
    titleWithCount: "通知 ({n} 条新消息)",
    all: "全部",
    unread: "未读",
    settings: "设置",
    markAllRead: "全部标为已读",
    deleteRead: "删除已读",
    deleteAll: "删除全部",
    typeSettings: "通知类型显示",
    noNotifications: "暂无通知",
    memberNew: "新会员",
    memberLost: "流失会员",
    agentSuffix: " - 代理：",
    justGot: "新增",
    justLost: "流失",
    customer: "1位客户",
    loadMore: "查看更多 ({current}/{total})",
    // Member detail
    memberDetailTitle: "详情",
    memberDetailLoading: "加载会员信息...",
    memberDetailEmpty: "未找到会员数据",
    memberName: "会员名称",
    memberBalance: "余额",
    memberType: "类型",
    memberParent: "上级代理",
    depositCount: "充值次数",
    totalDeposit: "总充值金额",
    withdrawCount: "提现次数",
    totalWithdraw: "总提现金额",
    lastLogin: "最后登录",
    registerTime: "注册时间",
    status: "状态",
    updatedAt: "更新时间",
    times: " 次",
    errorLoadMember: "加载会员信息失败",
    memberNotFound: "未找到会员信息",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PERMISSIONS
  // ═══════════════════════════════════════════════════════════════════════════
  permissions: {
    // Groups
    groupMember: "会员",
    groupInvite: "邀请码",
    groupReport: "报表",
    groupFinance: "财务",
    groupBet: "注单",
    groupPassword: "密码",
    groupRebate: "返水",
    groupAnalytics: "统计",
    groupSync: "同步",
    groupSystem: "系统",
    // Labels
    usersRead: "查看用户",
    usersWrite: "新增/编辑用户",
    usersDelete: "删除用户",
    rolesRead: "查看角色",
    rolesWrite: "新增/编辑角色",
    rolesDelete: "删除角色",
    memberRead: "查看会员",
    memberWrite: "新增/编辑会员",
    inviteRead: "查看邀请码",
    inviteWrite: "管理邀请码",
    reportRead: "查看报表",
    financeRead: "查看财务",
    financeWrite: "管理银行卡",
    betRead: "查看注单",
    passwordWrite: "修改密码",
    rebateRead: "查看返水",
    analyticsRead: "查看统计",
    syncRead: "查看同步",
    syncWrite: "管理同步",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // USER LIST PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  userList: {
    title: "会员列表",
    member: "会员",
    memberType: "会员类型",
    agentAccount: "代理账号",
    balance: "余额",
    depositCount: "充值次数",
    withdrawCount: "提现次数",
    totalDeposit: "总充值",
    totalWithdraw: "总提现",
    lastLogin: "最后登录时间",
    registerTime: "注册时间",
    accountLabel: "用户名：",
    accountPlaceholder: "输入用户名",
    registerTimeLabel: "注册时间：",
    statusLabel: "状态：",
    statusNormal: "正常",
    statusLocked: "已锁定",
    sortFieldLabel: "排序字段：",
    sortFieldBalance: "余额",
    sortFieldRegisterTime: "注册时间",
    sortOrderLabel: "排序方向：",
    sortDesc: "从大到小",
    sortAsc: "从小到大",
    addMember: "+ 添加会员",
    addAgent: "+ 新增代理",
    rebateSettings: "返水设置",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INVITE LIST PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  inviteList: {
    title: "邀请码列表",
    inviteCode: "邀请码",
    inviteType: "邀请类型",
    totalRegistered: "总注册数",
    userRegistered: "用户注册数",
    depositors: "充值人数",
    firstDayDeposit: "首日充值",
    firstDayDepositAmount: "首日充值（金额）",
    addedTime: "添加时间",
    addedTimeLabel: "添加时间：",
    inviteCodeLabel: "邀请码：",
    inviteCodePlaceholder: "请输入完整邀请码",
    addInviteCode: "+ 添加邀请码",
    copyLink: "复制链接",
    viewSettings: "查看设置",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BET LIST PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  betList: {
    title: "注单列表",
    serialNo: "交易编号",
    userLabel: "用户名",
    betTime: "投注时间",
    game: "游戏",
    gameType: "游戏类型",
    playType: "玩法",
    period: "期号",
    betInfo: "投注信息",
    betAmount: "投注金额",
    rebateAmount: "返水金额",
    winLose: "盈亏",
    // Search
    usernamePlaceholder: "请输入完整用户名",
    serialNoLabel: "交易编号：",
    serialNoPlaceholder: "输入交易编号",
    gameLabel: "游戏：",
    gameTypeLabel: "游戏类型：",
    playTypeLabel: "玩法：",
    statusLabel: "状态：",
    // Statuses
    statusAll: "全部",
    statusUnpaid: "未结算",
    statusWin: "中奖",
    statusLose: "未中奖",
    statusDraw: "平局",
    statusCancelUser: "用户取消",
    statusCancelSystem: "系统取消",
    statusAbnormal: "异常注单",
    statusUnpaidManual: "未结算（手动恢复）",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BET ORDER PAGE (3rd party)
  // ═══════════════════════════════════════════════════════════════════════════
  betOrder: {
    title: "第三方注单",
    serialNo: "交易编号",
    provider: "第三方游戏供应商",
    platformUsername: "平台用户名",
    gameType: "游戏类型",
    gameName: "第三方游戏名称",
    betAmount: "投注金额",
    validBet: "有效投注",
    prize: "奖金",
    winLose: "盈亏",
    betTime: "投注时间",
    serialNoLabel: "交易编号：",
    serialNoPlaceholder: "输入交易编号",
    platformUsernameLabel: "平台用户名：",
    platformUsernamePlaceholder: "输入用户名",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DEPOSIT LIST PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  depositList: {
    title: "充值列表",
    account: "用户名",
    agentBelong: "所属代理",
    transactionType: "交易类型",
    transactionStatus: "交易状态",
    accountLabel: "用户名：",
    accountPlaceholder: "用户名",
    typeLabel: "交易类型：",
    statusLabel: "状态：",
    // Types
    typeDeposit: "充值",
    typeTransfer: "转账",
    // Statuses
    statusPending: "处理中",
    statusSuccess: "成功",
    statusFailed: "失败",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WITHDRAWALS RECORD PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  withdrawals: {
    title: "提现记录",
    serialNo: "交易编号",
    createdTime: "创建时间",
    account: "用户名",
    agentBelong: "所属代理",
    requestAmount: "申请金额",
    fee: "手续费",
    actualAmount: "实际到账",
    accountLabel: "用户名：",
    accountPlaceholder: "用户名",
    serialNoLabel: "交易编号：",
    serialNoPlaceholder: "交易编号",
    statusLabel: "状态：",
    // Statuses
    statusPending: "处理中",
    statusSuccess: "成功",
    statusFailed: "失败",
    statusCancelled: "已取消",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REPORT FUNDS PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  reportFunds: {
    title: "交易明细",
    account: "用户名",
    agentBelong: "所属代理",
    depositCount: "充值次数",
    depositAmount: "充值金额",
    withdrawCount: "提现次数",
    withdrawAmount: "提现金额",
    serviceFee: "服务费",
    agentCommission: "代理佣金",
    promotion: "优惠",
    thirdPartyRebate: "第三方返水",
    thirdPartyBonus: "第三方奖金",
    accountLabel: "用户名：",
    accountPlaceholder: "输入用户名",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REPORT LOTTERY PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  reportLottery: {
    title: "彩票报表",
    account: "用户名",
    agentBelong: "所属代理",
    betCount: "投注次数",
    betAmount: "投注金额",
    validBet: "有效投注（扣除和局）",
    rebate: "返水",
    winLose: "盈亏",
    winLoseNoRebate: "盈亏结果（不含返水）",
    prizeAmount: "中奖金额",
    lotteryName: "彩种名称",
    bettorsCount: "投注人数",
    lotteryNameLabel: "彩种名称：",
    accountLabel: "用户名：",
    accountPlaceholder: "输入用户名",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REPORT THIRD GAME PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  reportThirdGame: {
    title: "供应商报表",
    account: "用户名",
    provider: "游戏供应商",
    betCount: "投注次数",
    betAmount: "投注金额",
    validBet: "有效投注",
    prize: "奖金",
    winLose: "盈亏",
    bettorsCount: "投注人数",
    providerLabel: "供应商：",
    accountLabel: "用户名：",
    accountPlaceholder: "输入用户名",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BANK LIST PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  bankList: {
    title: "银行卡列表",
    code: "编号",
    isDefault: "是否默认",
    bankName: "银行名称",
    branch: "支行",
    accountNumber: "银行账号",
    accountHolder: "开户名",
    accountLabel: "银行账号：",
    accountPlaceholder: "银行账号",
    addBank: "+ 添加银行卡",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REBATE ODDS PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  rebateOdds: {
    title: "返水比例列表",
    playType: "玩法",
    rebate: "返水",
    lotteryLabel: "选择彩种：",
    errorLoadLottery: "加载彩种列表失败",
    errorLoadType: "加载彩种类型失败",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EDIT PASSWORD PAGES
  // ═══════════════════════════════════════════════════════════════════════════
  editPassword: {
    agentLogin: "修改登录密码 (Agent)",
    agentFund: "修改资金密码 (Agent)",
    fundOldLabel: "旧资金密码",
    fundOldPlaceholder: "尚未设置资金密码",
    fundConfirmLabel: "确认",
    fundOldValidation: "请输入旧资金密码",
    fundSuccess: "资金密码修改成功",
    selectAgent: "请选择代理",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WITHDRAW PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  withdrawPage: {
    title: "提现",
    currentBalance: "当前余额：",
    instruction: "请先前往银行卡列表添加银行卡，添加后方可进行提现",
    goToPage: "前往页面",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SYSTEM USERS PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  systemUsers: {
    title: "用户管理",
    username: "账号",
    name: "名称",
    role: "角色",
    createdAt: "创建时间",
    searchPlaceholder: "账号或名称",
    addNew: "新增",
    editUser: "编辑用户",
    addUser: "新增用户",
    lock: "锁定",
    unlock: "解锁",
    active: "活跃",
    locked: "已锁定",
    confirmDelete: "确定要删除此用户吗？",
    usernamePlaceholder: "输入账号（字母、数字、_）",
    passwordPlaceholder: "输入密码（至少8位）",
    namePlaceholder: "输入用户名",
    selectRole: "选择角色",
    enterUsername: "请输入账号",
    usernameRule: "账号至少4位，只能包含字母、数字和_",
    enterPassword: "请输入密码",
    passwordMinLength: "密码至少8位",
    enterName: "请输入名称",
    selectRoleRequired: "请选择角色",
    updateSuccess: "更新成功",
    createSuccess: "创建成功",
    lockedSuccess: "已锁定账户",
    unlockedSuccess: "已解锁账户",
    deleteSuccess: "删除成功",
    deleteFailed: "删除失败",
    emailOptional: "邮箱（可选）",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SYSTEM ROLES PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  systemRoles: {
    title: "角色管理",
    name: "名称",
    type: "类型",
    level: "等级",
    permissionsCol: "权限",
    editRole: "编辑角色",
    addRole: "新增角色",
    addNew: "新增",
    assignPermissions: "分配权限",
    permissionsTitle: "分配权限 — {name}",
    allPermissions: "全部权限",
    rolePlaceholder: "输入角色名称",
    selectType: "选择类型",
    confirmDelete: "确定要删除此角色吗？",
    enterName: "请输入角色名称",
    selectTypeRequired: "请选择类型",
    updateSuccess: "更新成功",
    createSuccess: "创建成功",
    savePermissions: "保存权限",
    permissionsUpdateSuccess: "权限更新成功",
    deleteSuccess: "删除成功",
    deleteFailed: "删除失败",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SYNC DASHBOARD PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  sync: {
    // Endpoint labels
    endpointUsers: "会员",
    endpointDeposit: "充值",
    endpointWithdraw: "提现",
    endpointBetLottery: "彩票注单",
    endpointBetThird: "第三方注单",
    endpointReportLottery: "彩票报表",
    endpointReportFunds: "交易明细",
    endpointReportThird: "供应商报表",
    // Status
    statusActive: "活跃",
    statusLogging: "登录中...",
    statusOffline: "离线",
    statusError: "异常",
    statusDisabled: "已禁用",
    statusExpired: "Cookie已过期",
    statusChecking: "检查中...",
    // Overview
    overviewStatus: "状态",
    syncing: "同步中...",
    ready: "就绪",
    totalRecords: "总记录",
    activeAgents: "活跃代理",
    syncCycle: "同步周期",
    customize: "自定义",
    // Agent table
    agentStatus: "代理状态",
    colAgentData: "代理 / 数据",
    colAccount: "账号",
    colRecords: "记录",
    colLastSync: "最后同步",
    // Toolbar
    addAgent: "添加代理",
    loginAll: "全部登录",
    syncAll: "同步",
    stopSync: "停止",
    autoSyncOn: "自动: 开启",
    autoSyncOff: "自动: 关闭",
    autoSyncEnabled: "已启用自动同步",
    autoSyncDisabled: "已停用自动同步",
    autoSyncError: "更改自动同步状态失败",
    // Dropdown
    editInfo: "编辑信息",
    loggingIn: "登录中...",
    loginEE88: "登录 EE88",
    loggingOut: "退出中...",
    logoutEE88: "退出 EE88",
    changePassword: "修改密码",
    deleteData: "删除数据",
    disable: "禁用",
    // Agent modal
    addAgentTitle: "添加代理",
    editAgentTitle: "编辑代理：{name}",
    agentName: "代理名称",
    agentNamePlaceholder: "例如：Agent 01",
    usernameEE88: "EE88 用户名",
    usernameEE88Placeholder: "EE88 账号",
    passwordNew: "新密码",
    passwordEE88: "EE88 密码",
    passwordNewPlaceholder: "留空则不修改",
    passwordEE88Placeholder: "EE88 密码",
    baseUrl: "Base URL",
    baseUrlPlaceholder: "留空使用默认",
    // Password modal
    changePasswordTitle: "修改密码：{name}",
    oldPasswordPlaceholder: "输入EE88代理旧密码",
    newPasswordPlaceholder: "新密码（至少6位）",
    confirmPasswordPlaceholder: "确认新密码",
    changingPassword: "保存中...",
    // Sync interval modal
    syncIntervalTitle: "同步周期设置",
    syncIntervalDesc: "为每种数据类型设置独立的同步周期（分钟）。最少1分钟。",
    dataType: "数据类型",
    cycleMinutes: "周期（分钟）",
    saving: "保存中...",
    saveAll: "全部保存",
    // Confirm dialogs
    confirmDisable: "确定要**禁用**代理 **{name}** 吗？",
    confirmDisableTitle: "确认禁用",
    confirmDisableBtn: "禁用",
    confirmDeleteAll: "确定要**删除所有**同步数据吗？\n此操作不可撤销。",
    confirmDeleteAllTitle: "确认删除所有",
    confirmDeleteAllBtn: "删除所有",
    confirmDeleteAgent: "确定要**删除**代理 **{name}** 的数据吗？\n此操作不可撤销。",
    confirmDeleteAgentTitle: "确认删除代理数据",
    // Toast messages
    enterAgentName: "请输入代理名称",
    agentUpdated: "代理已更新",
    usernamePasswordRequired: "EE88用户名和密码为必填",
    agentCreated: "代理创建成功",
    agentSaveError: "保存代理失败",
    enterOldPassword: "请输入旧密码",
    passwordMinLength: "新密码至少6位",
    passwordMismatch: "两次密码不一致",
    passwordChangeSuccess: "密码修改成功",
    passwordChangeError: "密码修改失败",
    syncAllTriggered: "已触发全部同步",
    syncAllError: "触发同步失败",
    syncStopRequested: "已请求停止同步",
    syncStopError: "停止同步失败",
    intervalMin: "{label}：最少1分钟",
    intervalUpdated: "同步周期已更新",
    intervalUpdateError: "更新同步周期失败",
    syncAgentTriggered: "已触发代理同步",
    syncAgentError: "触发代理同步失败",
    syncEndpointTriggered: "已触发同步 {label}",
    syncEndpointError: "触发同步失败",
    deleteAllSuccess: "已删除所有数据",
    deleteAllError: "删除数据失败",
    deleteAgentSuccess: "已删除代理数据",
    deleteAgentError: "删除代理数据失败",
    loginSuccess: "登录成功",
    loginError: "登录失败",
    loginAgentError: "代理登录失败",
    logoutSuccess: "已退出代理",
    logoutError: "退出失败",
    logoutAgentError: "代理退出失败",
    loginAllResult: "已登录 {success}/{total} 个代理",
    loginAllError: "全部登录失败",
    disabledSuccess: "已禁用代理",
    disabledError: "禁用代理失败",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SYNC V2 PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  syncV2: {
    title: "Sync V2",
    agentCol: "员工 - 代理",
    stopSync: "停止同步",
    errorLoadAgents: "加载代理列表失败",
    stopRequested: "已请求停止同步",
    noSyncRunning: "没有正在运行的同步",
    stopError: "停止同步失败",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS — FINANCE
  // ═══════════════════════════════════════════════════════════════════════════
  analyticsFinance: {
    title: "充提分析",
    trendTitle: "充值 / 提现 / 净利润 趋势",
    depositByAgent: "按代理充值",
    withdrawByAgent: "按代理提现",
    feesCommissions: "手续费 & 佣金 & 优惠",
    depositStatus: "充值状态",
    withdrawStatus: "提现状态",
    topDeposit: "Top 10 充值最多",
    topWithdraw: "Top 10 提现最多",
    deposit: "充值",
    withdrawal: "提现",
    netProfit: "净利润",
    transactionFee: "交易手续费",
    commission: "佣金",
    promotionLabel: "优惠",
    thirdPartyRebate: "第三方返水",
    rank: "#",
    agent: "代理",
    totalDeposit: "总充值",
    totalWithdraw: "总提现",
    orderCount: "订单数",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS — BETTING
  // ═══════════════════════════════════════════════════════════════════════════
  analyticsBetting: {
    title: "投注分析",
    totalBetLottery: "彩票总投注",
    totalBetThird: "第三方总投注",
    totalProfit: "总利润",
    lotteryTypes: "彩种数量",
    orders: "注",
    plays: "次",
    thirdPlatforms: "个第三方平台",
    lotteryTrend: "彩票投注趋势",
    thirdTrend: "第三方投注趋势",
    profitByDay: "每日利润（彩票 + 第三方）",
    betByLottery: "按彩种投注",
    platformShare: "第三方平台占比",
    platformRanking: "第三方平台排名",
    topBettors: "Top 10 投注最多（彩票）",
    bet: "投注",
    betThird: "第三方投注",
    profitLottery: "彩票利润",
    profitThird: "第三方利润",
    total: "合计",
    rank: "#",
    platform: "平台",
    revenue: "收入",
    totalBet: "总投注",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS — MEMBERS
  // ═══════════════════════════════════════════════════════════════════════════
  analyticsMembers: {
    title: "会员分析",
    totalMembers: "总会员",
    newMembers30d: "新增（30天）",
    lostMembers30d: "流失（30天）",
    net30d: "净增（30天）",
    byAgent: "按代理分布",
    memberStatus: "会员状态",
    memberType: "会员分类",
    trend30d: "新增 / 流失趋势（30天）",
    registerByMonth: "按月注册",
    topBalance: "Top 10 余额最高",
    topDeposit: "Top 10 充值最多（累计）",
    members: "会员",
    newMembers: "新增",
    lostMembers: "流失",
    net: "净增",
    register: "注册",
    rank: "#",
    agent: "代理",
    balance: "余额",
    totalDeposit: "总充值",
    depositCount: "充值次数",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS — AGENTS
  // ═══════════════════════════════════════════════════════════════════════════
  analyticsAgents: {
    title: "代理绩效",
    totalAgents: "总代理",
    totalDeposit: "总充值 ({days}天)",
    totalCommission: "总佣金",
    totalMembers: "总会员",
    compareTitle: "代理对比：充值 / 提现 / 投注",
    depositTrend: "按代理充值趋势（近7天）",
    commissionByDay: "每日佣金 & 优惠",
    loginHistory: "代理登录历史",
    agentDetail: "代理详情",
    loginDetail: "代理登录详情",
    deposit: "充值",
    withdraw: "提现",
    betLottery: "彩票投注",
    betThird: "第三方投注",
    commission: "佣金",
    promotion: "优惠",
    success: "成功",
    failed: "失败",
    // Detail table
    agentCol: "代理",
    statusCol: "状态",
    memberCount: "会员",
    totalDepositCol: "总充值",
    totalWithdrawCol: "总提现",
    betLotteryCol: "彩票投注",
    wlLotteryCol: "彩票盈亏",
    betThirdCol: "第三方投注",
    wlThirdCol: "第三方盈亏",
    commissionCol: "佣金",
    // Login detail table
    successCount: "成功",
    failedCount: "失败",
    avgCaptcha: "平均验证码",
    lastLoginCol: "最后登录",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS — REVENUE (营收)
  // ═══════════════════════════════════════════════════════════════════════════
  analyticsRevenue: {
    title: "营收报表",
    summaryTable: "员工营收总览",
    employeeName: "员工姓名",
    lotteryProfit: "彩票利润",
    thirdGameProfit: "第三方利润",
    promotionCol: "优惠",
    rebateCol: "返点",
    totalRevenue: "总营收",
    customerCountCol: "客户数",
    grandTotal: "合计",
    totalCustomers: "总客户",
    uploadCustomers: "上传客户",
    exportXlsx: "导出XLSX",
    noCustomerData: "暂无员工-客户数据，请上传Excel文件。",
    uploadSuccess: "上传成功：{employees} 名员工，{mappings} 条关联",
    uploadError: "上传文件失败",
    exportSuccess: "导出成功",
    exportError: "导出失败",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // OLD CUSTOMERS (旧客户)
  // ═══════════════════════════════════════════════════════════════════════════
  oldCustomers: {
    title: "客户",
    upload: "上传客户",
    totalCustomers: "客户总数",
    totalEmployees: "员工",
    totalAgents: "代理",
    totalSources: "来源",
    filterEmployee: "员工",
    filterAgent: "代理",
    searchPlaceholder: "搜索账号、联系方式...",
    noData: "暂无旧客户数据，请上传Excel文件。",
    listTitle: "客户列表",
    records: "条记录",
    colDate: "日期",
    colEmployee: "员工",
    colAgent: "代理",
    colUsername: "账号",
    colContact: "联系方式",
    colSource: "来源",
    colReferral: "推荐账号",
    colFirstDeposit: "首充",
    uploadSuccess: "上传成功：{customers} 客户，{employees} 员工",
    uploadError: "上传文件失败",
    exportXlsx: "导出XLSX",
    exportSuccess: "导出成功",
    exportError: "导出失败",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTE CUSTOMER (从文本粘贴添加客户)
  // ═══════════════════════════════════════════════════════════════════════════
  noteCustomer: {
    btn: "备注客户",
    title: "备注客户",
    pasteLabel: "粘贴数据",
    pastePlaceholder: "将Telegram/Zalo的内容粘贴到这里...",
    parseBtn: "识别",
    previewLabel: "预览",
    clearAll: "清空",
    emptyInput: "请在左侧输入框粘贴数据",
    parseError: "无法识别数据格式，请检查。",
    parseSuccess: "已识别 {count} 位客户",
    emptyPreview: "在左侧粘贴数据后点击「识别」",
    noData: "没有数据可添加",
    addBtn: "添加到列表",
    addRow: "添加行",
    missingUsername: "第 {row} 行缺少账号（username）",
    addSuccess: "已添加 {inserted} 位客户，跳过 {skipped} 条重复",
    addError: "添加客户失败",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PERMISSION TREE (role assignment UI)
  // ═══════════════════════════════════════════════════════════════════════════
  permTree: {
    memberGroup: "会员",
    memberList: "查看会员",
    memberWrite: "添加/编辑会员",
    inviteGroup: "邀请码",
    inviteList: "查看邀请码",
    inviteWrite: "管理邀请码",
    reportGroup: "报表",
    reportRead: "查看报表",
    commissionGroup: "财务",
    financeRead: "查看财务",
    financeWrite: "管理银行",
    betGroup: "投注单",
    betRead: "查看投注单",
    customerGroup: "客户信息",
    passwordWrite: "修改密码",
    rebateGroup: "返点",
    rebateRead: "查看返点",
    systemGroup: "系统",
    usersRead: "查看用户",
    usersWrite: "创建/编辑用户",
    usersDelete: "删除用户",
    rolesRead: "查看角色",
    rolesWrite: "创建/编辑角色",
    rolesDelete: "删除角色",
    syncRead: "查看同步",
    syncWrite: "管理同步",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PLAY TYPES (lottery bet types)
  // ═══════════════════════════════════════════════════════════════════════════
  playType: {
    lo2so: "二字定位",
    lo2so1k: "二字定位 1K",
    lo3so: "三字定位",
    lo4so: "四字定位",
    xien2: "二串",
    xien3: "三串",
    xien4: "四串",
    deDau: "首位猜号",
    deDacBiet: "特别猜号",
    deDauDuoi: "首尾猜号",
    dau: "头数",
    duoi: "尾数",
    cang3Dau: "三字首位",
    cang3DacBiet: "三字特别",
    cang3DauDuoi: "三字首尾",
    cang4DacBiet: "四字特别",
    truotXien4: "滑串4",
    truotXien8: "滑串8",
    truotXien10: "滑串10",
    keoDoi: "拖对",
    tong0: "总和 0",
    tong1: "总和 1",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LOTTERY NAMES (game names)
  // ═══════════════════════════════════════════════════════════════════════════
  lottery: {
    // Sicbo
    sicbo30s: "骰宝 30秒",
    sicbo20s: "骰宝 20秒",
    sicbo40s: "骰宝 40秒",
    sicbo50s: "骰宝 50秒",
    sicbo1m: "骰宝 1分钟",
    sicbo1m30s: "骰宝 1.5分钟",
    // 北部
    mienBac: "北部彩",
    mBacNhanh3m: "北部快开 3分钟",
    mBacNhanh5m: "北部快开 5分钟",
    mBacVip45s: "北部VIP 45秒",
    mBacVip75s: "北部VIP 75秒",
    mBacVip2m: "北部VIP 2分钟",
    xsMienBac: "北部彩票",
    // Keno
    kenoVip20s: "Keno VIP 20秒",
    kenoVip30s: "Keno VIP 30秒",
    kenoVip40s: "Keno VIP 40秒",
    kenoVip50s: "Keno VIP 50秒",
    kenoVip1m: "Keno VIP 1分钟",
    kenoVip5m: "Keno VIP 5分钟",
    // Win Go
    winGo45s: "Win Go 45秒",
    winGo1m: "Win Go 1分钟",
    winGo3m: "Win Go 3分钟",
    winGo5m: "Win Go 5分钟",
    winGo30s: "Win Go 30秒",
    // 南部（省份）
    bacLieu: "薄辽",
    vungTau: "头顿",
    tienGiang: "前江",
    kienGiang: "坚江",
    daLat: "大叻",
    binhPhuoc: "平福",
    binhDuong: "平阳",
    anGiang: "安江",
    binhThuan: "平顺",
    caMau: "金瓯",
    canTho: "芹苴",
    hauGiang: "后江",
    dongThap: "同塔",
    tayNinh: "西宁",
    socTrang: "朔庄",
    tpHCM: "胡志明市",
    dongNai: "同奈",
    traVinh: "茶荣",
    vinhLong: "永隆",
    // 南部VIP
    mNamVip5m: "南部VIP 5分钟",
    mNamVip45s: "南部VIP 45秒",
    mNamVip1m: "南部VIP 1分钟",
    mNamVip90s: "南部VIP 90秒",
    mNamVip2m: "南部VIP 2分钟",
    // 中部
    daNang: "岘港",
    thuaThienHue: "承天顺化",
    quangTri: "广治",
    phuYen: "富安",
    quangBinh: "广平",
    quangNam: "广南",
    quangNgai: "广义",
    ninhThuan: "宁顺",
    konTum: "昆嵩",
    khanhHoa: "庆和",
    giaLai: "嘉莱",
    binhDinh: "平定",
    dakLak: "得乐",
    dakNong: "得农",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT DIALOG
  // ═══════════════════════════════════════════════════════════════════════════
  exportDialog: {
    title: "选择数据源",
    dbLocalDesc: "从已同步的本地数据导出，速度更快。",
    ee88Desc: "直接从源导出，数据最新但速度较慢。",
    dbLocal: "本地数据库",
    ee88: "ee88",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EXCEL EXPORT (Revenue)
  // ═══════════════════════════════════════════════════════════════════════════
  excelExport: {
    monthLabel: "{month}月/{year}",
    fileName: "营收_{timestamp}.xlsx",
    sheetSummary: "总览",
    sheetDetail: "营收明细",
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
    monthlyProfit: "{month}月/{year} 利润",
    grandTotalLabel: "合计",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LANGUAGE
  // ═══════════════════════════════════════════════════════════════════════════
  language: {
    vi: "Tiếng Việt",
    zh: "中文",
  },
};
