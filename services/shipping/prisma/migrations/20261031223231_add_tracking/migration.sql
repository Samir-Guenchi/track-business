-- CreateTable
CREATE TABLE "shipments" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "carrier" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "tracking_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'created',
    "public_code" TEXT NOT NULL,
    "last_event_at" TIMESTAMPTZ(3),
    "next_poll_at" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_events" (
    "id" UUID NOT NULL,
    "shipment_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "status" TEXT,
    "carrier_status" TEXT NOT NULL,
    "location" TEXT,
    "note" TEXT,
    "failure_reason" TEXT,
    "at" TIMESTAMPTZ(3) NOT NULL,
    "dedupe_key" TEXT NOT NULL,
    "received_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shipments_public_code_key" ON "shipments"("public_code");

-- CreateIndex
CREATE INDEX "shipments_store_id_order_id_idx" ON "shipments"("store_id", "order_id");

-- CreateIndex
CREATE INDEX "shipments_next_poll_at_idx" ON "shipments"("next_poll_at");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_carrier_tracking_number_key" ON "shipments"("carrier", "tracking_number");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_store_id_reference_key" ON "shipments"("store_id", "reference");

-- CreateIndex
CREATE INDEX "tracking_events_shipment_id_at_idx" ON "tracking_events"("shipment_id", "at");

-- CreateIndex
CREATE UNIQUE INDEX "tracking_events_shipment_id_dedupe_key_key" ON "tracking_events"("shipment_id", "dedupe_key");

-- AddForeignKey
ALTER TABLE "tracking_events" ADD CONSTRAINT "tracking_events_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
