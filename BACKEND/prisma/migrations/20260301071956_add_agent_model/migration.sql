-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ext_username" TEXT NOT NULL,
    "session_cookie" TEXT NOT NULL,
    "cookie_expires" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agents_ext_username_key" ON "agents"("ext_username");
