-- CreateTable
CREATE TABLE "wilayas" (
    "code" INTEGER NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_fr" TEXT NOT NULL,
    "dataset_version" TEXT NOT NULL,
    "retired_in" TEXT,

    CONSTRAINT "wilayas_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "communes" (
    "id" INTEGER NOT NULL,
    "wilaya_code" INTEGER NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_fr" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "postal_code" TEXT,
    "dataset_version" TEXT NOT NULL,
    "retired_in" TEXT,

    CONSTRAINT "communes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stop_desks" (
    "id" UUID NOT NULL,
    "carrier" TEXT NOT NULL,
    "commune_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "hours" JSONB,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "stop_desks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carrier_geo_mappings" (
    "carrier" TEXT NOT NULL,
    "commune_id" INTEGER NOT NULL,
    "carrier_code" TEXT NOT NULL,
    "carrier_name" TEXT,

    CONSTRAINT "carrier_geo_mappings_pkey" PRIMARY KEY ("carrier","commune_id")
);

-- CreateTable
CREATE TABLE "geo_code_changes" (
    "id" SERIAL NOT NULL,
    "dataset_version" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "old_code" INTEGER NOT NULL,
    "new_code" INTEGER NOT NULL,
    "note" TEXT,

    CONSTRAINT "geo_code_changes_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE INDEX "communes_wilaya_code_idx" ON "communes"("wilaya_code");

-- CreateIndex
CREATE INDEX "stop_desks_commune_id_carrier_idx" ON "stop_desks"("commune_id", "carrier");

-- CreateIndex
CREATE UNIQUE INDEX "carrier_geo_mappings_carrier_carrier_code_key" ON "carrier_geo_mappings"("carrier", "carrier_code");

-- CreateIndex
CREATE UNIQUE INDEX "geo_code_changes_dataset_version_entity_old_code_key" ON "geo_code_changes"("dataset_version", "entity", "old_code");

-- CreateIndex
CREATE INDEX "outbox_events_published_at_occurred_at_idx" ON "outbox_events"("published_at", "occurred_at");

-- AddForeignKey
ALTER TABLE "communes" ADD CONSTRAINT "communes_wilaya_code_fkey" FOREIGN KEY ("wilaya_code") REFERENCES "wilayas"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stop_desks" ADD CONSTRAINT "stop_desks_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "communes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrier_geo_mappings" ADD CONSTRAINT "carrier_geo_mappings_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "communes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
