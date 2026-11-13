-- AlterTable
ALTER TABLE "shipments" ADD COLUMN     "delivery_type" TEXT;

-- CreateTable
CREATE TABLE "delivery_requests" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "shipment_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handled_at" TIMESTAMPTZ(3),
    "handled_by" UUID,

    CONSTRAINT "delivery_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delivery_requests_store_id_state_created_at_idx" ON "delivery_requests"("store_id", "state", "created_at");

-- CreateIndex
CREATE INDEX "delivery_requests_shipment_id_created_at_idx" ON "delivery_requests"("shipment_id", "created_at");

-- AddForeignKey
ALTER TABLE "delivery_requests" ADD CONSTRAINT "delivery_requests_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
