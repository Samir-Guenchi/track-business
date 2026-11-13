-- CreateTable
CREATE TABLE "parcels" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "carrier" TEXT NOT NULL,
    "tracking_number" TEXT NOT NULL,
    "order_id" UUID,
    "expected_cod" INTEGER,
    "status" TEXT NOT NULL,
    "delivered_at" TIMESTAMPTZ(3),
    "received_cod" INTEGER,
    "fees" INTEGER NOT NULL DEFAULT 0,
    "payout_id" UUID,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "parcels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "carrier" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "paid_at" DATE NOT NULL,
    "total_amount" INTEGER NOT NULL,
    "cod_amount" INTEGER NOT NULL,
    "fees" INTEGER NOT NULL,
    "lines" INTEGER NOT NULL,
    "matched" INTEGER NOT NULL,
    "flagged" INTEGER NOT NULL,
    "imported_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "entry_id" UUID NOT NULL,
    "account" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "parcel_id" UUID,
    "payout_id" UUID,
    "at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "money_settings" (
    "store_id" UUID NOT NULL,
    "missing_after_days" INTEGER NOT NULL DEFAULT 14,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "money_settings_pkey" PRIMARY KEY ("store_id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "store_id" TEXT,
    "correlation_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "published_at" TIMESTAMPTZ(3),

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_events" (
    "consumer" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "processed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_events_pkey" PRIMARY KEY ("consumer","event_id")
);

-- CreateIndex
CREATE INDEX "parcels_store_id_status_idx" ON "parcels"("store_id", "status");

-- CreateIndex
CREATE INDEX "parcels_status_delivered_at_idx" ON "parcels"("status", "delivered_at");

-- CreateIndex
CREATE UNIQUE INDEX "parcels_store_id_carrier_tracking_number_key" ON "parcels"("store_id", "carrier", "tracking_number");

-- CreateIndex
CREATE INDEX "payouts_store_id_paid_at_idx" ON "payouts"("store_id", "paid_at");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_store_id_carrier_reference_key" ON "payouts"("store_id", "carrier", "reference");

-- CreateIndex
CREATE INDEX "ledger_entries_store_id_account_idx" ON "ledger_entries"("store_id", "account");

-- CreateIndex
CREATE INDEX "ledger_entries_entry_id_idx" ON "ledger_entries"("entry_id");

-- CreateIndex
CREATE INDEX "outbox_events_published_at_occurred_at_idx" ON "outbox_events"("published_at", "occurred_at");
