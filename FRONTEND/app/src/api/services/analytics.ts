import { api } from "../client";

// --- Finance Analytics ---
export interface FinanceAnalytics {
  trend30d: { date: string; deposit: number; withdrawal: number; net: number }[];
  depositByAgent: { agentName: string; value: number }[];
  withdrawalByAgent: { agentName: string; value: number }[];
  dailyFees: { date: string; chargeFee: number; commission: number; promotion: number; thirdRebate: number }[];
  depositStatusBreakdown: { status: string; count: number; amount: number }[];
  withdrawalStatusBreakdown: { status: string; count: number; amount: number }[];
  topDepositors: { username: string; agentName: string; totalAmount: number; count: number }[];
  topWithdrawers: { username: string; agentName: string; totalAmount: number; count: number }[];
}

// --- Betting Analytics ---
export interface BettingAnalytics {
  lotteryTrend: { date: string; betAmount: number; winLose: number; betCount: number }[];
  thirdGameTrend: { date: string; betAmount: number; winLose: number; betTimes: number }[];
  lotteryByType: { name: string; betAmount: number; winLose: number; betCount: number }[];
  platformRanking: { name: string; betAmount: number; turnover: number; winLose: number; betTimes: number }[];
  profitByDay: { date: string; lotteryProfit: number; thirdGameProfit: number; totalProfit: number }[];
  topBettors: { username: string; agentName: string; betAmount: number; winLose: number }[];
}

// --- Member Analytics ---
export interface MemberAnalytics {
  totalMembers: number;
  membersByAgent: { agentName: string; count: number }[];
  memberStatusDistribution: { status: string; count: number }[];
  memberTypeDistribution: { type: string; count: number }[];
  churnTrend: { date: string; newMembers: number; lostMembers: number; net: number }[];
  topMembersByBalance: { username: string; agentName: string; money: number }[];
  topMembersByDeposit: { username: string; agentName: string; depositAmount: number; depositCount: number }[];
  registrationByMonth: { month: string; count: number }[];
}

// --- Agent Performance ---
export interface AgentPerformance {
  agentOverview: {
    name: string;
    status: string;
    userCount: number;
    totalDeposit: number;
    totalWithdrawal: number;
    lotteryBet: number;
    lotteryWinLose: number;
    thirdBet: number;
    thirdWinLose: number;
    commission: number;
  }[];
  agentTrend: {
    date: string;
    agents: { name: string; deposit: number; withdrawal: number }[];
  }[];
  loginHistory: {
    agentName: string;
    successCount: number;
    failCount: number;
    avgCaptchaAttempts: number;
    lastLogin: string | null;
  }[];
  agentCommissionTrend: { date: string; commission: number; promotion: number }[];
}

// --- API calls ---

export function fetchFinanceAnalytics(days: number = 30) {
  return api.get<{ success: boolean; data: FinanceAnalytics }>("/analytics/finance", { params: { days } });
}

export function fetchBettingAnalytics(days: number = 30) {
  return api.get<{ success: boolean; data: BettingAnalytics }>("/analytics/betting", { params: { days } });
}

export function fetchMemberAnalytics() {
  return api.get<{ success: boolean; data: MemberAnalytics }>("/analytics/members");
}

export function fetchAgentPerformance(days: number = 30) {
  return api.get<{ success: boolean; data: AgentPerformance }>("/analytics/agents", { params: { days } });
}

// --- Revenue Analytics ---

export interface RevenueEmployeeSummary {
  employeeId: string;
  employeeName: string;
  lotteryWinLose: number;
  thirdGameWinLose: number;
  promotion: number;
  thirdRebate: number;
  totalRevenue: number;
  customerCount: number;
}

export interface RevenueSummaryResult {
  month: string;
  employees: RevenueEmployeeSummary[];
  grandTotal: {
    lotteryWinLose: number;
    thirdGameWinLose: number;
    promotion: number;
    thirdRebate: number;
    totalRevenue: number;
    customerCount: number;
  };
  hasCustomerData: boolean;
}

export interface CustomerDetail {
  customerUsername: string;
  assignedDate: string | null;
  lotteryWinLose: number;
  thirdGameWinLose: number;
  promotion: number;
  thirdRebate: number;
  totalRevenue: number;
}

export interface EmployeeDetailResult {
  employeeId: string;
  employeeName: string;
  month: string;
  customers: CustomerDetail[];
  monthlyTotal: {
    lotteryWinLose: number;
    thirdGameWinLose: number;
    promotion: number;
    thirdRebate: number;
    totalRevenue: number;
  };
}

export interface MonthlyRevenueRow {
  month: string;
  byEmployee: Record<string, number>;
  rowTotal: number;
}

export interface RevenueMatrixResult {
  months: MonthlyRevenueRow[];
  grandTotalByEmployee: Record<string, number>;
  grandTotal: number;
}

export interface RevenueExportData {
  summary: RevenueSummaryResult;
  details: EmployeeDetailResult[];
  matrix: RevenueMatrixResult;
}

export function fetchRevenueSummary(month: string) {
  return api.get<{ success: boolean; data: RevenueSummaryResult }>("/analytics/revenue", { params: { month } });
}

export function fetchRevenueExportData(month: string) {
  return api.get<{ success: boolean; data: RevenueExportData }>("/analytics/revenue/export", {
    params: { month },
    timeout: 120000,
  });
}

export function uploadCustomerFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return api.post<{ success: boolean; data: { employeeCount: number; mappingCount: number } }>(
    "/analytics/revenue/upload-customers",
    formData,
    { headers: { "Content-Type": "multipart/form-data" }, timeout: 60000 },
  );
}

export function fetchRevenueEmployees() {
  return api.get<{ success: boolean; data: any[] }>("/analytics/revenue/employees");
}

// --- Old Customer (Khách hàng cũ) ---

export interface CalendarMonth {
  label: string; // "T11", "T12", "T1", ...
  days: number;  // 28-31
}

export interface OldCustomerItem {
  id: string;
  assignedDate: string | null;
  employeeName: string;
  agentCode: string | null;
  username: string;
  contactInfo: string | null;
  source: string | null;
  referralAccount: string | null;
  firstDeposit: number | null;
  onlineDays: string[] | null;
  createdAt: string;
}

export interface OldCustomerListResult {
  total: number;
  items: OldCustomerItem[];
  page: number;
  limit: number;
  calendarMonths: CalendarMonth[];
}

export interface OldCustomerUploadResult {
  totalRows: number;
  insertedRows: number;
  skippedRows: number;
  employeeNames: string[];
  calendarMonths: CalendarMonth[];
}

export interface OldCustomerSummary {
  totalCustomers: number;
  employees: { name: string; count: number }[];
  agents: { code: string; count: number }[];
  sources: { name: string; count: number }[];
  calendarMonths: CalendarMonth[];
}

export function fetchOldCustomers(params: {
  page?: number;
  limit?: number;
  employee?: string;
  agentCode?: string;
  source?: string;
  search?: string;
}) {
  return api.get<{ success: boolean; data: OldCustomerListResult }>(
    "/analytics/old-customers",
    { params },
  );
}

export function fetchOldCustomerSummary() {
  return api.get<{ success: boolean; data: OldCustomerSummary }>(
    "/analytics/old-customers/summary",
  );
}

export function uploadOldCustomerFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return api.post<{ success: boolean; data: OldCustomerUploadResult }>(
    "/analytics/old-customers/upload",
    formData,
    { headers: { "Content-Type": "multipart/form-data" }, timeout: 120000 },
  );
}

export interface OldCustomerExportResult {
  items: OldCustomerItem[];
  total: number;
  calendarMonths: CalendarMonth[];
}

export function exportOldCustomers(params: {
  employee?: string;
  agentCode?: string;
  search?: string;
}) {
  return api.get<{ success: boolean; data: OldCustomerExportResult }>(
    "/analytics/old-customers/export",
    { params, timeout: 120000 },
  );
}

// --- Note Customer (thêm KH từ text paste) ---

export interface NoteCustomerInput {
  assignedDate: string;
  employeeName: string;
  agentCode: string;
  username: string;
  contactInfo: string;
  source: string;
  referralAccount: string;
  firstDeposit: number | null;
}

export interface NoteCustomerResult {
  insertedCount: number;
  skippedCount: number;
}

export function addNoteCustomers(customers: NoteCustomerInput[]) {
  return api.post<{ success: boolean; data: NoteCustomerResult }>(
    "/analytics/old-customers/note",
    { customers },
    { timeout: 30000 },
  );
}
