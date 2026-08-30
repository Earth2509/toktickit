-- Give every active attachment a stable slot before enforcing one active row per slot.
ALTER TABLE "Attachment" ADD COLUMN "activeSlot" INTEGER;

WITH ranked_active_attachments AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (PARTITION BY "ticketId" ORDER BY "createdAt", "id") AS "slot"
  FROM "Attachment"
  WHERE "removedAt" IS NULL
)
UPDATE "Attachment"
SET "activeSlot" = ranked_active_attachments."slot"
FROM ranked_active_attachments
WHERE "Attachment"."id" = ranked_active_attachments."id";

ALTER TABLE "Attachment"
  ADD CONSTRAINT "Attachment_active_attachment_requires_slot"
  CHECK ("removedAt" IS NOT NULL OR "activeSlot" IS NOT NULL);

ALTER TABLE "Attachment"
  ADD CONSTRAINT "Attachment_active_slot_is_positive"
  CHECK ("activeSlot" IS NULL OR "activeSlot" > 0);

CREATE UNIQUE INDEX "Attachment_active_ticket_slot_key"
  ON "Attachment"("ticketId", "activeSlot")
  WHERE "removedAt" IS NULL;
