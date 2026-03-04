import { api } from "../client";

export interface KpiCard {
  label: string;
  value: number;
  count: number;
  yesterdayValue: number;
  yesterdayCount: number;
}

export interface TrendPoint {
  date: string;
  deposit: number;
  withdrawal: number;
}

export interface PlatformShare {
  name: string;
  value: number;
}

export interface AgentOverviewRow {
  id: string;
  name: string;
  status: string;
  onlineCounts: Record<string, number>;
  newAccountsToday: number;
  betLotteryToday: number;
  betThirdToday: number;
  depositToday: number;
  totalDepositMonth: number;
  totalBetLotteryMonth: number;
  totalBetThirdMonth: number;
  winLoseLotteryMonth: number;
}

export interface RecentNotification {
  id: string;
  agentName: string;
  type: string;
  username: string;
  money: string | null;
  createdAt: string;
}

export interface UserLoginRecord {
  id: string;
  username: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface DashboardSummary {
  kpi: {
    deposit: KpiCard;
    withdrawal: KpiCard;
    betLottery: KpiCard;
    betThirdGame: KpiCard;
    winLoseLottery: KpiCard;
    winLoseThirdGame: KpiCard;
    newMembers: KpiCard;
    lostMembers: KpiCard;
  };
  trend7d: TrendPoint[];
  platformShare: PlatformShare[];
  lotteryShare: PlatformShare[];
  agents: AgentOverviewRow[];
  agentDates: string[];
  notifications: RecentNotification[];
  loginInfo: {
    lastLoginAt: string | null;
    lastLoginIp: string | null;
  };
  agentSessionSummary: {
    total: number;
    active: number;
    error: number;
    offline: number;
  };
  userLoginHistory: UserLoginRecord[];
}

export function fetchDashboardSummary(startDate?: string, endDate?: string) {
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  return api.get<{ success: boolean; data: DashboardSummary }>("/dashboard/summary", { params });
}

export function fetchOnlineMembers(agentId: string, date: string) {
  return api.get<{ success: boolean; data: string[] }>("/dashboard/online-members", {
    params: { agentId, date },
  });
}

// --- Activity Feed (separate from bell notifications) ---

export interface ActivityItem {
  id: string;
  type: "member_new" | "member_lost" | "big_deposit" | "big_withdrawal";
  agentId: string;
  agentName: string;
  username: string;
  money: string | null;
  createdAt: string;
}

export function fetchActivityFeed() {
  return api.get<{ success: boolean; data: ActivityItem[] }>("/dashboard/activity");
}

// --- Dashboard Settings ---

export interface DashboardSettings {
  pollInterval: number;
  bigDepositMin: number;
  bigWithdrawMin: number;
}

export function fetchDashboardSettings() {
  return api.get<{ success: boolean; data: DashboardSettings }>("/dashboard/settings");
}

export function saveDashboardSettings(data: Partial<DashboardSettings>) {
  return api.put<{ success: boolean; data: DashboardSettings }>("/dashboard/settings", data);
}

// --- Member Detail (reuse notification member detail API) ---

export function fetchMemberDetail(agentId: string, username: string) {
  return api.get<{ success: boolean; data: MemberDetail }>(`/notifications/member/${agentId}/${username}`);
}

export interface MemberDetail {
  username: string;
  typeFormat: string | null;
  parentUser: string | null;
  money: string | null;
  depositCount: number;
  withdrawalCount: number;
  depositAmount: string;
  withdrawalAmount: string;
  loginTime: string | null;
  registerTime: string | null;
  statusFormat: string | null;
  syncedAt: string;
}
