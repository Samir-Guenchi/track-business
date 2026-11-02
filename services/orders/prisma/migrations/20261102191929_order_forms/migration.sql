-- CreateTable
CREATE TABLE "order_forms" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "products" JSONB NOT NULL,
    "delivery_types" TEXT[],
    "max_quantity" INTEGER NOT NULL,
    "accent" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "order_forms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_forms_key_key" ON "order_forms"("key");

-- CreateIndex
CREATE INDEX "order_forms_store_id_created_at_idx" ON "order_forms"("store_id", "created_at");
