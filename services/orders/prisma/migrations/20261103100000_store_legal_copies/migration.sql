-- CreateTable
CREATE TABLE "store_legal_copies" (
    "store_id" UUID NOT NULL,
    "profile" JSONB NOT NULL,
    "source_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "store_legal_copies_pkey" PRIMARY KEY ("store_id")
);

