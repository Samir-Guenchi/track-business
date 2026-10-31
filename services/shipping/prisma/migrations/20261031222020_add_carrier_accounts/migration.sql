-- CreateTable
CREATE TABLE "carrier_accounts" (
    "store_id" UUID NOT NULL,
    "carrier" TEXT NOT NULL,
    "kek_id" TEXT NOT NULL,
    "wrapped_key" BYTEA NOT NULL,
    "secret" BYTEA NOT NULL,
    "hint" TEXT NOT NULL,
    "verified_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "carrier_accounts_pkey" PRIMARY KEY ("store_id","carrier")
);
