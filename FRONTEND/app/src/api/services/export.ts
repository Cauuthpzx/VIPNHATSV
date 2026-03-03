import { api } from "../client";

interface ExportParams {
  startDate?: string;
  endDate?: string;
  username?: string;
  agentId?: string;
}

interface ExportResponse<T = Record<string, unknown>> {
  success: boolean;
  data: { items: T[]; total: number };
}

function exportEndpoint(path: string) {
  return (params: ExportParams) =>
    api.post<ExportResponse>(`/export/${path}`, params);
}

export const exportReportFunds = exportEndpoint("report-funds");
export const exportReportLottery = exportEndpoint("report-lottery");
export const exportReportThirdGame = exportEndpoint("report-third-game");
export const exportDepositList = exportEndpoint("deposit-list");
export const exportWithdrawalsRecord = exportEndpoint("withdrawals-record");
export const exportBetList = exportEndpoint("bet-list");
export const exportBetOrder = exportEndpoint("bet-order");
export const exportUserList = exportEndpoint("user-list");
