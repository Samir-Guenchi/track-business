-- CreateTable
CREATE TABLE "confirmation_links" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "confirmation_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "confirmation_links_token_hash_key" ON "confirmation_links"("token_hash");

-- CreateIndex
CREATE INDEX "confirmation_links_store_id_order_id_idx" ON "confirmation_links"("store_id", "order_id");
