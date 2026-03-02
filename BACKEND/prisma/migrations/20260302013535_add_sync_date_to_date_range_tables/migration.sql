-- AlterTable
ALTER TABLE "proxy_bet_orders" ADD COLUMN     "sync_date" TEXT;

-- AlterTable
ALTER TABLE "proxy_bets" ADD COLUMN     "sync_date" TEXT;

-- AlterTable
ALTER TABLE "proxy_deposits" ADD COLUMN     "sync_date" TEXT;

-- AlterTable
ALTER TABLE "proxy_withdrawals" ADD COLUMN     "sync_date" TEXT;

-- CreateIndex
CREATE INDEX "proxy_bet_orders_sync_date_idx" ON "proxy_bet_orders"("sync_date");

-- CreateIndex
CREATE INDEX "proxy_bets_sync_date_idx" ON "proxy_bets"("sync_date");

-- CreateIndex
CREATE INDEX "proxy_deposits_sync_date_idx" ON "proxy_deposits"("sync_date");

-- CreateIndex
CREATE INDEX "proxy_withdrawals_sync_date_idx" ON "proxy_withdrawals"("sync_date");
