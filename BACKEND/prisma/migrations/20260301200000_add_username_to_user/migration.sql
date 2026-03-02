-- Step 1: Add username column as nullable first
ALTER TABLE "users" ADD COLUMN "username" TEXT;

-- Step 2: Populate username from email prefix for existing users
UPDATE "users" SET "username" = SPLIT_PART("email", '@', 1) WHERE "username" IS NULL;

-- Step 3: Make username NOT NULL
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;

-- Step 4: Add unique constraint
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- Step 5: Make email optional (drop NOT NULL)
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;

-- Step 6: Drop unique constraint on email
DROP INDEX "users_email_key";
