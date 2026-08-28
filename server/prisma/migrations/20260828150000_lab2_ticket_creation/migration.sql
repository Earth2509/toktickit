-- CreateEnum
CREATE TYPE "RequestedPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('NEW');

-- CreateTable
CREATE TABLE "Ticket" (
    "id" SERIAL NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "requesterId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "relatedSystemId" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requestedPriority" "RequestedPriority" NOT NULL,
    "currentStatus" "TicketStatus" NOT NULL DEFAULT 'NEW',
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON "Ticket"("ticketNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_idempotencyKey_key" ON "Ticket"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Ticket_requesterId_createdAt_idx" ON "Ticket"("requesterId", "createdAt");

-- CreateIndex
CREATE INDEX "Ticket_categoryId_idx" ON "Ticket"("categoryId");

-- CreateIndex
CREATE INDEX "Ticket_relatedSystemId_idx" ON "Ticket"("relatedSystemId");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "Requester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_relatedSystemId_fkey" FOREIGN KEY ("relatedSystemId") REFERENCES "RelatedSystem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
