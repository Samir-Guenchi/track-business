-- CreateTable
CREATE TABLE "store_profiles" (
    "store_id" UUID NOT NULL,
    "origin_wilaya_code" INTEGER,
    "origin_commune_id" INTEGER,
    "contact_phone" TEXT,
    "logo_url" TEXT,
    "daily_volume" TEXT,
    "carriers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "default_language" TEXT NOT NULL DEFAULT 'fr',
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "store_profiles_pkey" PRIMARY KEY ("store_id")
);

-- AddForeignKey
ALTER TABLE "store_profiles" ADD CONSTRAINT "store_profiles_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

