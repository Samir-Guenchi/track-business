-- CreateTable
CREATE TABLE "return_batches" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "carrier" TEXT NOT NULL,
    "courier_name" TEXT,
    "note" TEXT,
    "received_by" UUID NOT NULL,
    "missing" TEXT[],
    "unknown" TEXT[],
    "already_received" TEXT[],
    "received_count" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "return_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_receipts" (
    "shipment_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "condition" TEXT NOT NULL,
    "unannounced" BOOLEAN NOT NULL,
    "received_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "return_receipts_pkey" PRIMARY KEY ("shipment_id")
);

-- CreateIndex
CREATE INDEX "return_batches_store_id_created_at_id_idx" ON "return_batches"("store_id", "created_at" DESC, "id");

-- CreateIndex
CREATE INDEX "return_receipts_batch_id_idx" ON "return_receipts"("batch_id");

-- AddForeignKey
ALTER TABLE "return_receipts" ADD CONSTRAINT "return_receipts_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_receipts" ADD CONSTRAINT "return_receipts_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "return_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
