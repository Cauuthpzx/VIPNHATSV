import { z } from "zod";

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(10),
  agentId: z.string().optional(),
});

export const userListSchema = paginationSchema.extend({
  username: z.string().optional(),
  user_type: z.string().optional(),
  status: z.string().optional(),
});

export const inviteListSchema = paginationSchema.extend({
  create_time: z.string().optional(),
  user_register_time: z.string().optional(),
  invite_code: z.string().optional(),
});

/** Schema cho invite list đọc từ DB local (không gọi upstream) */
export const inviteListLocalSchema = paginationSchema.extend({
  create_time: z.string().optional(),
  invite_code: z.string().optional(),
});

export const reportLotterySchema = paginationSchema.extend({
  date: z.string().optional(),
  lottery_id: z.string().optional(),
  username: z.string().optional(),
});

export const reportFundsSchema = paginationSchema.extend({
  date: z.string().optional(),
  username: z.string().optional(),
});

export const reportThirdGameSchema = paginationSchema.extend({
  date: z.string().optional(),
  username: z.string().optional(),
  platform_id: z.string().optional(),
});

export const bankListSchema = paginationSchema.extend({
  username: z.string().optional(),
  bank_name: z.string().optional(),
  card_no: z.string().optional(),
});

export const depositListSchema = paginationSchema.extend({
  username: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  date: z.string().optional(),
});

export const withdrawalsRecordSchema = paginationSchema.extend({
  username: z.string().optional(),
  status: z.string().optional(),
  date: z.string().optional(),
});

export const betListSchema = paginationSchema.extend({
  create_time: z.string().optional(),
  date: z.string().optional(),
  username: z.string().optional(),
  serial_no: z.string().optional(),
  lottery_id: z.string().optional(),
  play_type: z.coerce.number().optional(),
  play_type_id: z.string().optional(),
  play_id: z.string().optional(),
  series_id: z.string().optional(),
  status: z.string().optional(),
  es: z.coerce.number().optional(),
  is_summary: z.coerce.number().optional(),
});

export const betOrderSchema = paginationSchema.extend({
  bet_time: z.string().optional(),
  serial_no: z.string().optional(),
  platform_username: z.string().optional(),
  es: z.coerce.number().optional(),
});

export const rebateOddsSchema = z.object({
  type: z.string(),
  series_id: z.string().optional(),
  lotteryId: z.string().optional(),
  agentId: z.string().optional(),
});

export const getLotterySchema = z.object({
  type: z.string().optional(),
  series_id: z.string().optional(),
  agentId: z.string().optional(),
});

export const updateAgentCookieSchema = z.object({
  sessionCookie: z.string().min(1),
  cookieExpires: z.string().optional(),
});

export const editPasswordSchema = z.object({
  old_password: z.string().min(1),
  new_password: z.string().min(6),
  confirm_password: z.string().min(6),
  agentId: z.string().min(1, "agentId is required"),
});

export const editFundPasswordSchema = z.object({
  old_fund_password: z.string().optional(),
  new_fund_password: z.string().min(6),
  confirm_fund_password: z.string().min(6),
  agentId: z.string().min(1, "agentId is required"),
});

export type UserListInput = z.infer<typeof userListSchema>;
export type BetListInput = z.infer<typeof betListSchema>;
export type RebateOddsInput = z.infer<typeof rebateOddsSchema>;
export type GetLotteryInput = z.infer<typeof getLotterySchema>;
