CREATE TYPE "ActionTakenStatus" AS ENUM ('OPEN', 'COMPLETED', 'CANCELLED');

CREATE TABLE "ActionTaken" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "performedById" INTEGER NOT NULL,
    "assignedToId" INTEGER NOT NULL,
    "status" "ActionTakenStatus" NOT NULL DEFAULT 'OPEN',
    "actionAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "result" TEXT,
    "followUpRequired" BOOLEAN NOT NULL,
    "followUpNote" TEXT,
    "attachmentNotes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ActionTaken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActionTakenIdempotency" (
    "id" SERIAL NOT NULL,
    "actorId" INTEGER NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "actionTakenId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ActionTakenIdempotency_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ActionTaken_ticketId_status_completedAt_id_idx" ON "ActionTaken"("ticketId", "status", "completedAt", "id");
CREATE INDEX "ActionTaken_assignedToId_status_actionAt_idx" ON "ActionTaken"("assignedToId", "status", "actionAt");
CREATE INDEX "ActionTaken_performedById_actionAt_idx" ON "ActionTaken"("performedById", "actionAt");
CREATE UNIQUE INDEX "ActionTakenIdempotency_actorId_ticketId_key_key" ON "ActionTakenIdempotency"("actorId", "ticketId", "key");
CREATE INDEX "ActionTakenIdempotency_expiresAt_idx" ON "ActionTakenIdempotency"("expiresAt");
CREATE INDEX "ActionTakenIdempotency_actionTakenId_idx" ON "ActionTakenIdempotency"("actionTakenId");

ALTER TABLE "ActionTaken" ADD CONSTRAINT "ActionTaken_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActionTaken" ADD CONSTRAINT "ActionTaken_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ActionTaken" ADD CONSTRAINT "ActionTaken_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ActionTakenIdempotency" ADD CONSTRAINT "ActionTakenIdempotency_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActionTakenIdempotency" ADD CONSTRAINT "ActionTakenIdempotency_actionTakenId_fkey" FOREIGN KEY ("actionTakenId") REFERENCES "ActionTaken"("id") ON DELETE CASCADE ON UPDATE CASCADE;
