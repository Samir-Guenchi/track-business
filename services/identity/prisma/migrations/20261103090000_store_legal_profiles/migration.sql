-- CreateTable
CREATE TABLE "store_legal_profiles" (
    "store_id" UUID NOT NULL,
    "regime" TEXT,
    "tax_regime" TEXT,
    "legal_name" TEXT,
    "address" TEXT,
    "nif" TEXT,
    "nis" TEXT,
    "rc_number" TEXT,
    "auto_entrepreneur_card" TEXT,
    "article_imposition" TEXT,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "store_legal_profiles_pkey" PRIMARY KEY ("store_id")
);

-- AddForeignKey
ALTER TABLE "store_legal_profiles" ADD CONSTRAINT "store_legal_profiles_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

