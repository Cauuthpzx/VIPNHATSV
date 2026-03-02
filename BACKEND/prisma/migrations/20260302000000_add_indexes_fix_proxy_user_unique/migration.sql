-- DropIndex
DROP INDEX IF EXISTS "proxy_users_agent_id_idx";

-- DropIndex (replace global unique with composite unique)
DROP INDEX IF EXISTS "proxy_users_username_key";

-- CreateIndex: composite unique (agentId + username) for ProxyUser
CREATE UNIQUE INDEX "proxy_users_agent_id_username_key" ON "proxy_users"("agent_id", "username");

-- CreateIndex: RefreshToken.expiresAt for cleanup queries
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex: User.createdAt for ordered listing
CREATE INDEX "users_created_at_idx" ON "users"("created_at" DESC);
