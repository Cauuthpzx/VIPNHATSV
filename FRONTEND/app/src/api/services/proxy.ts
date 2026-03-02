import { api } from "../client";

// Generic proxy response type from our backend
interface ProxyResponse<T = Record<string, unknown>> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    totalData?: Record<string, unknown>;
  };
}

// --- User & Invite ---

export function fetchUserList(params: {
  page: number;
  limit: number;
  username?: string;
  status?: string;
  sort_field?: string;
  sort_order?: string;
}) {
  return api.post<ProxyResponse>("/proxy/user", params);
}

export function fetchInviteList(params: {
  page: number;
  limit: number;
  create_time?: string;
  invite_code?: string;
}) {
  return api.post<ProxyResponse>("/proxy/invite-list", params);
}

// --- Reports ---

export function fetchReportLottery(params: {
  page: number;
  limit: number;
  date?: string;
  lottery_id?: string;
  username?: string;
}) {
  return api.post<ProxyResponse>("/proxy/report-lottery", params);
}

export function fetchReportFunds(params: {
  page: number;
  limit: number;
  date?: string;
  username?: string;
}) {
  return api.post<ProxyResponse>("/proxy/report-funds", params);
}

export function fetchReportThirdGame(params: {
  page: number;
  limit: number;
  date?: string;
  username?: string;
  platform_id?: string;
}) {
  return api.post<ProxyResponse>("/proxy/report-third-game", params);
}

// --- Bank & Finance ---

export function fetchBankList(params: {
  page: number;
  limit: number;
  card_no?: string;
}) {
  return api.post<ProxyResponse>("/proxy/bank-list", params);
}

export function fetchDepositList(params: {
  page: number;
  limit: number;
  username?: string;
  type?: string;
  status?: string;
  date?: string;
}) {
  return api.post<ProxyResponse>("/proxy/deposit-list", params);
}

export function fetchWithdrawalsRecord(params: {
  page: number;
  limit: number;
  username?: string;
  serial_no?: string;
  status?: string;
  date?: string;
}) {
  return api.post<ProxyResponse>("/proxy/withdrawals-record", params);
}

// --- Betting ---

export function fetchBetList(params: {
  page: number;
  limit: number;
  date?: string;
  username?: string;
  serial_no?: string;
  lottery_id?: string;
  play_type?: number;
  play_type_id?: string;
  play_id?: string;
  series_id?: string;
  status?: string;
  is_summary?: number;
  es?: number;
}) {
  return api.post<ProxyResponse>("/proxy/bet-list", params);
}

export function fetchBetOrder(params: {
  page: number;
  limit: number;
  bet_time?: string;
  serial_no?: string;
  platform_username?: string;
  es?: number;
}) {
  return api.post<ProxyResponse>("/proxy/bet-order", params);
}

// --- Rebate & Lottery ---

export function fetchRebateOdds(params: {
  type: string;
  series_id?: string;
  lotteryId?: string;
}) {
  return api.post<ProxyResponse>("/proxy/rebate-odds", params);
}

export function fetchLotteryDropdown(params?: {
  type?: string;
  series_id?: string;
}) {
  return api.post<ProxyResponse>("/proxy/lottery-dropdown", params ?? {});
}

// --- Agents ---

export function fetchAgents() {
  return api.get("/agents");
}

export function fetchCookieHealth() {
  return api.get("/agents/cookie-health");
}

export function createAgent(data: { name: string; extUsername: string; extPassword: string; baseUrl?: string }) {
  return api.post("/agents", data);
}

export function updateAgent(agentId: string, data: { name?: string; extPassword?: string; baseUrl?: string | null; isActive?: boolean }) {
  return api.patch(`/agents/${agentId}`, data);
}

export function deleteAgent(agentId: string, mode: "deactivate" | "destroy" = "deactivate") {
  return api.delete(`/agents/${agentId}`, { params: { mode } });
}

// --- Registration ---

export function registerAccount(data: { username: string; password: string; name: string; email?: string }) {
  return api.post("/auth/register", data);
}

// --- Profile & Auth Management ---

export function updateProfile(data: { name: string }) {
  return api.put("/auth/profile", data);
}

export function changeSystemPassword(data: { oldPassword: string; newPassword: string }) {
  return api.put("/auth/change-password", data);
}

export function changeSystemFundPassword(data: { oldPassword?: string; newPassword: string }) {
  return api.put("/auth/change-fund-password", data);
}

export function logoutAllDevices() {
  return api.post("/auth/logout-all");
}

export function fetchActiveSessions() {
  return api.get<{ success: boolean; data: SessionItem[] }>("/auth/sessions");
}

export function revokeSession(sessionId: string) {
  return api.delete(`/auth/sessions/${sessionId}`);
}

export interface SessionItem {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
}

// --- Upstream password change (agent ee88) ---

export function editUpstreamPassword(params: {
  old_password: string;
  new_password: string;
  confirm_password: string;
  agentId: string;
}) {
  return api.post("/proxy/edit-password", params);
}

export function editUpstreamFundPassword(params: {
  old_fund_password?: string;
  new_fund_password: string;
  confirm_fund_password: string;
  agentId: string;
}) {
  return api.post("/proxy/edit-fund-password", params);
}

// --- EE88 Auth (Auto Login) ---

export function loginAgentEE88(agentId: string) {
  return api.post(`/ee88-auth/${agentId}/login`, {}, { timeout: 120_000 });
}

export function logoutAgentEE88(agentId: string) {
  return api.post(`/ee88-auth/${agentId}/logout`);
}

export function loginAllAgentsEE88() {
  return api.post("/ee88-auth/login-all", {}, { timeout: 600_000 });
}

export function checkAgentSession(agentId: string) {
  return api.post(`/ee88-auth/${agentId}/check`);
}

export function getAgentSessionInfo(agentId: string) {
  return api.get(`/ee88-auth/${agentId}/session`);
}

export function setAgentCookieManual(agentId: string, cookie: string) {
  return api.patch(`/ee88-auth/${agentId}/cookie`, { cookie });
}

export function fetchAgentLoginHistory(agentId: string, limit: number = 20) {
  return api.get(`/ee88-auth/login-history/${agentId}`, { params: { limit } });
}
