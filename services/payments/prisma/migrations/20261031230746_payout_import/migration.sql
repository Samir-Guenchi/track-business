-- payouts is still empty: nothing could import a statement before this migration.
-- AlterTable
ALTER TABLE "payouts" DROP COLUMN "lines",
ADD COLUMN     "claimed_until" TIMESTAMPTZ(3),
ADD COLUMN     "line_count" INTEGER NOT NULL,
ADD COLUMN     "raw_lines" JSONB NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'processing',
ALTER COLUMN "matched" SET DEFAULT 0,
ALTER COLUMN "flagged" SET DEFAULT 0;

-- CreateIndex
CREATE INDEX "payouts_status_claimed_until_idx" ON "payouts"("status", "claimed_until");
