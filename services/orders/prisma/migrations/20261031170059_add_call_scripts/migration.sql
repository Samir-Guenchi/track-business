-- CreateTable
CREATE TABLE "call_scripts" (
    "store_id" UUID NOT NULL,
    "language" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "call_scripts_pkey" PRIMARY KEY ("store_id","language")
);
