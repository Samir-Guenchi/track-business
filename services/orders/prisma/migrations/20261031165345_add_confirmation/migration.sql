-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "calls_today" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_call_day" TEXT,
ADD COLUMN     "locked_by" UUID,
ADD COLUMN     "locked_until" TIMESTAMPTZ(3),
ADD COLUMN     "next_call_at" TIMESTAMPTZ(3),
ADD COLUMN     "unreached_calls" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "call_attempts" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "outcome" TEXT NOT NULL,
    "reason" TEXT,
    "note" TEXT,
    "call_back_at" TIMESTAMPTZ(3),
    "duration_sec" INTEGER NOT NULL,
    "at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "call_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "confirmation_settings" (
    "store_id" UUID NOT NULL,
    "assignment" TEXT NOT NULL,
    "agent_rules" JSONB NOT NULL,
    "max_attempts_per_day" INTEGER NOT NULL,
    "unreachable_after" INTEGER NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "confirmation_settings_pkey" PRIMARY KEY ("store_id")
);

-- CreateIndex
CREATE INDEX "call_attempts_store_id_order_id_at_idx" ON "call_attempts"("store_id", "order_id", "at" DESC);

-- CreateIndex
CREATE INDEX "call_attempts_store_id_agent_id_at_idx" ON "call_attempts"("store_id", "agent_id", "at");

-- CreateIndex
CREATE INDEX "orders_store_id_status_next_call_at_created_at_idx" ON "orders"("store_id", "status", "next_call_at", "created_at");
