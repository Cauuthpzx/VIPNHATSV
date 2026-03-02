-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "ip_address" TEXT,
ADD COLUMN     "user_agent" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "last_login_ip" TEXT,
ADD COLUMN     "token_version" INTEGER NOT NULL DEFAULT 0;
