-- AlterTable
ALTER TABLE "shipments" ADD COLUMN     "to_wilaya_code" INTEGER;

-- CreateTable
CREATE TABLE "carrier_suggestion_settings" (
    "store_id" UUID NOT NULL,
    "price_weight" INTEGER NOT NULL,
    "reliability_weight" INTEGER NOT NULL,
    "speed_weight" INTEGER NOT NULL,
    "rules" JSONB NOT NULL DEFAULT '[]',
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "carrier_suggestion_settings_pkey" PRIMARY KEY ("store_id")
);

-- CreateIndex
CREATE INDEX "shipments_to_wilaya_code_carrier_status_idx" ON "shipments"("to_wilaya_code", "carrier", "status");
