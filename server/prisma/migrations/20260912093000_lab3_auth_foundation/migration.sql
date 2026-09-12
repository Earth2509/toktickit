-- Lab 3 authentication foundation.  Rename rather than copy/delete the Lab 2
-- requester table so every existing Ticket requesterId and attachment removal
-- attribution foreign key continues to point at the same records and IDs.
ALTER TABLE "Requester" RENAME TO "User";
ALTER TABLE "User" RENAME CONSTRAINT "Requester_pkey" TO "User_pkey";
ALTER INDEX "Requester_email_key" RENAME TO "User_email_key";

CREATE TYPE "UserRole" AS ENUM ('REQUESTER', 'IT_STAFF', 'ADMINISTRATOR');

ALTER TABLE "User"
  ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'REQUESTER',
  ADD COLUMN "passwordHash" TEXT,
  ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "credentialVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE "Session" (
  "id" SERIAL NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "userId" INTEGER NOT NULL,
  "credentialVersion" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

ALTER TABLE "Session"
  ADD CONSTRAINT "Session_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
