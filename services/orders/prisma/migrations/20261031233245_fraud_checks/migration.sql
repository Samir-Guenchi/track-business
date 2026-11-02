-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "risk_flags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "blacklist_entries" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "phone" TEXT,
    "name" TEXT,
    "name_key" TEXT,
    "commune_id" INTEGER,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "expires_at" TIMESTAMPTZ(3),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blacklist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blacklist_entries_store_id_phone_idx" ON "blacklist_entries"("store_id", "phone");

-- CreateIndex
CREATE INDEX "blacklist_entries_store_id_name_key_commune_id_idx" ON "blacklist_entries"("store_id", "name_key", "commune_id");

-- CreateIndex
CREATE INDEX "blacklist_entries_store_id_created_at_id_idx" ON "blacklist_entries"("store_id", "created_at" DESC, "id");
