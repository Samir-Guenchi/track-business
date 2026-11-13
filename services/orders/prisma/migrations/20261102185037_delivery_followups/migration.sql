-- CreateTable
CREATE TABLE "delivery_followups" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "order_ref" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "wilaya_code" INTEGER NOT NULL,
    "shipment_id" TEXT NOT NULL,
    "carrier" TEXT NOT NULL,
    "tracking_number" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL,
    "last_attempt_at" TIMESTAMPTZ(3) NOT NULL,
    "due_at" TIMESTAMPTZ(3) NOT NULL,
    "status" TEXT NOT NULL,
    "decision" TEXT,
    "stop_desk_id" TEXT,
    "note" TEXT,
    "decided_by" TEXT,
    "decided_at" TIMESTAMPTZ(3),
    "outcome" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "delivery_followups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delivery_followups_store_id_status_due_at_idx" ON "delivery_followups"("store_id", "status", "due_at");

-- CreateIndex
CREATE INDEX "delivery_followups_store_id_created_at_idx" ON "delivery_followups"("store_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_followups_store_id_shipment_id_key" ON "delivery_followups"("store_id", "shipment_id");
