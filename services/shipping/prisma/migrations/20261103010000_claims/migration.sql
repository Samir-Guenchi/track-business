-- CreateTable
CREATE TABLE "claims" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "shipment_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'open',
    "declared_value" INTEGER NOT NULL,
    "recovered" INTEGER,
    "note" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMPTZ(3),
    "closed_at" TIMESTAMPTZ(3),

    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "claims_shipment_id_key" ON "claims"("shipment_id");

-- CreateIndex
CREATE INDEX "claims_store_id_state_created_at_idx" ON "claims"("store_id", "state", "created_at");

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
