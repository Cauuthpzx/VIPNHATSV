-- CreateTable
CREATE TABLE "proxy_users" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "type_format" TEXT,
    "parent_user" TEXT,
    "money" DECIMAL(18,4),
    "deposit_count" INTEGER DEFAULT 0,
    "withdrawal_count" INTEGER DEFAULT 0,
    "deposit_amount" DECIMAL(18,4) DEFAULT 0,
    "withdrawal_amount" DECIMAL(18,4) DEFAULT 0,
    "login_time" TEXT,
    "register_time" TEXT,
    "status_format" TEXT,
    "raw" JSONB NOT NULL DEFAULT '{}',
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proxy_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proxy_invites" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "invite_code" TEXT NOT NULL,
    "user_type" TEXT,
    "reg_count" INTEGER DEFAULT 0,
    "scope_reg_count" INTEGER DEFAULT 0,
    "recharge_count" INTEGER DEFAULT 0,
    "first_recharge_count" INTEGER DEFAULT 0,
    "register_recharge_count" INTEGER DEFAULT 0,
    "remark" TEXT,
    "create_time" TEXT,
    "raw" JSONB NOT NULL DEFAULT '{}',
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proxy_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proxy_deposits" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "user_parent_format" TEXT,
    "amount" DECIMAL(18,4),
    "type" TEXT,
    "status" TEXT,
    "create_time" TEXT,
    "raw" JSONB NOT NULL DEFAULT '{}',
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proxy_deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proxy_withdrawals" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "serial_no" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "user_parent_format" TEXT,
    "amount" DECIMAL(18,4),
    "user_fee" DECIMAL(18,4),
    "true_amount" DECIMAL(18,4),
    "status_format" TEXT,
    "create_time" TEXT,
    "raw" JSONB NOT NULL DEFAULT '{}',
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proxy_withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proxy_bets" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "serial_no" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "lottery_name" TEXT,
    "play_type_name" TEXT,
    "play_name" TEXT,
    "issue" TEXT,
    "content" TEXT,
    "money" DECIMAL(18,4),
    "rebate_amount" DECIMAL(18,4),
    "result" DECIMAL(18,4),
    "status_text" TEXT,
    "create_time" TEXT,
    "raw" JSONB NOT NULL DEFAULT '{}',
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proxy_bets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proxy_bet_orders" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "serial_no" TEXT NOT NULL,
    "platform_id_name" TEXT,
    "platform_username" TEXT,
    "c_name" TEXT,
    "game_name" TEXT,
    "bet_amount" DECIMAL(18,4),
    "turnover" DECIMAL(18,4),
    "prize" DECIMAL(18,4),
    "win_lose" DECIMAL(18,4),
    "bet_time" TEXT,
    "raw" JSONB NOT NULL DEFAULT '{}',
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proxy_bet_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proxy_report_lottery" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "user_parent_format" TEXT,
    "lottery_name" TEXT NOT NULL,
    "bet_count" INTEGER DEFAULT 0,
    "bet_amount" DECIMAL(18,4),
    "valid_amount" DECIMAL(18,4),
    "rebate_amount" DECIMAL(18,4),
    "result" DECIMAL(18,4),
    "win_lose" DECIMAL(18,4),
    "prize" DECIMAL(18,4),
    "report_date" TEXT NOT NULL,
    "raw" JSONB NOT NULL DEFAULT '{}',
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proxy_report_lottery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proxy_report_funds" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "user_parent_format" TEXT,
    "deposit_count" INTEGER DEFAULT 0,
    "deposit_amount" DECIMAL(18,4),
    "withdrawal_count" INTEGER DEFAULT 0,
    "withdrawal_amount" DECIMAL(18,4),
    "charge_fee" DECIMAL(18,4),
    "agent_commission" DECIMAL(18,4),
    "promotion" DECIMAL(18,4),
    "third_rebate" DECIMAL(18,4),
    "third_activity_amount" DECIMAL(18,4),
    "report_date" TEXT NOT NULL,
    "raw" JSONB NOT NULL DEFAULT '{}',
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proxy_report_funds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proxy_report_third_game" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "platform_id_name" TEXT NOT NULL,
    "t_bet_times" INTEGER DEFAULT 0,
    "t_bet_amount" DECIMAL(18,4),
    "t_turnover" DECIMAL(18,4),
    "t_prize" DECIMAL(18,4),
    "t_win_lose" DECIMAL(18,4),
    "report_date" TEXT NOT NULL,
    "raw" JSONB NOT NULL DEFAULT '{}',
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proxy_report_third_game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proxy_banks" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "upstream_id" TEXT NOT NULL,
    "is_default_format" TEXT,
    "bank_name" TEXT,
    "bank_branch" TEXT,
    "card_no" TEXT,
    "name" TEXT,
    "raw" JSONB NOT NULL DEFAULT '{}',
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proxy_banks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "proxy_users_username_key" ON "proxy_users"("username");

-- CreateIndex
CREATE INDEX "proxy_users_agent_id_idx" ON "proxy_users"("agent_id");

-- CreateIndex
CREATE INDEX "proxy_users_register_time_idx" ON "proxy_users"("register_time" DESC);

-- CreateIndex
CREATE INDEX "proxy_users_agent_id_register_time_idx" ON "proxy_users"("agent_id", "register_time" DESC);

-- CreateIndex
CREATE INDEX "proxy_invites_create_time_idx" ON "proxy_invites"("create_time" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "proxy_invites_agent_id_invite_code_key" ON "proxy_invites"("agent_id", "invite_code");

-- CreateIndex
CREATE INDEX "proxy_deposits_create_time_idx" ON "proxy_deposits"("create_time" DESC);

-- CreateIndex
CREATE INDEX "proxy_deposits_username_create_time_idx" ON "proxy_deposits"("username", "create_time" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "proxy_deposits_agent_id_username_amount_type_create_time_key" ON "proxy_deposits"("agent_id", "username", "amount", "type", "create_time");

-- CreateIndex
CREATE UNIQUE INDEX "proxy_withdrawals_serial_no_key" ON "proxy_withdrawals"("serial_no");

-- CreateIndex
CREATE INDEX "proxy_withdrawals_create_time_idx" ON "proxy_withdrawals"("create_time" DESC);

-- CreateIndex
CREATE INDEX "proxy_withdrawals_username_create_time_idx" ON "proxy_withdrawals"("username", "create_time" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "proxy_bets_serial_no_key" ON "proxy_bets"("serial_no");

-- CreateIndex
CREATE INDEX "proxy_bets_create_time_idx" ON "proxy_bets"("create_time" DESC);

-- CreateIndex
CREATE INDEX "proxy_bets_username_create_time_idx" ON "proxy_bets"("username", "create_time" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "proxy_bet_orders_serial_no_key" ON "proxy_bet_orders"("serial_no");

-- CreateIndex
CREATE INDEX "proxy_bet_orders_bet_time_idx" ON "proxy_bet_orders"("bet_time" DESC);

-- CreateIndex
CREATE INDEX "proxy_bet_orders_platform_username_bet_time_idx" ON "proxy_bet_orders"("platform_username", "bet_time" DESC);

-- CreateIndex
CREATE INDEX "proxy_report_lottery_report_date_idx" ON "proxy_report_lottery"("report_date" DESC);

-- CreateIndex
CREATE INDEX "proxy_report_lottery_username_report_date_idx" ON "proxy_report_lottery"("username", "report_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "proxy_report_lottery_agent_id_username_lottery_name_report__key" ON "proxy_report_lottery"("agent_id", "username", "lottery_name", "report_date");

-- CreateIndex
CREATE INDEX "proxy_report_funds_report_date_idx" ON "proxy_report_funds"("report_date" DESC);

-- CreateIndex
CREATE INDEX "proxy_report_funds_username_report_date_idx" ON "proxy_report_funds"("username", "report_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "proxy_report_funds_agent_id_username_report_date_key" ON "proxy_report_funds"("agent_id", "username", "report_date");

-- CreateIndex
CREATE INDEX "proxy_report_third_game_report_date_idx" ON "proxy_report_third_game"("report_date" DESC);

-- CreateIndex
CREATE INDEX "proxy_report_third_game_username_report_date_idx" ON "proxy_report_third_game"("username", "report_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "proxy_report_third_game_agent_id_username_platform_id_name__key" ON "proxy_report_third_game"("agent_id", "username", "platform_id_name", "report_date");

-- CreateIndex
CREATE UNIQUE INDEX "proxy_banks_upstream_id_key" ON "proxy_banks"("upstream_id");

-- CreateIndex
CREATE INDEX "proxy_banks_agent_id_idx" ON "proxy_banks"("agent_id");
