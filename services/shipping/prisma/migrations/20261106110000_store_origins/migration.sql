-- Where each store ships from (#160), copied from identity.store.profile-updated.v1.
CREATE TABLE "store_origins" (
    "store_id" UUID NOT NULL,
    "origin_wilaya_code" INTEGER,
    "origin_commune_id" INTEGER,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "store_origins_pkey" PRIMARY KEY ("store_id")
);
