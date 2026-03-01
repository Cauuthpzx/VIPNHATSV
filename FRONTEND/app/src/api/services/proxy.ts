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
}) {
  return api.post<ProxyResponse>("/proxy/user", params);
}

export function fetchInviteList(params: {
  page: number;
  limit: number;
  create_time?: string;
  user_register_time?: string;
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
