-- Resellers and affiliates (#198).
-- CreateTable
CREATE TABLE "resellers" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "portal_code" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "resellers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reseller_products" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "supplier_price" INTEGER NOT NULL,
    "min_price" INTEGER,
    "active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "reseller_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reseller_orders" (
    "order_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "reseller_id" UUID NOT NULL,
    "margin" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "paid_at" TIMESTAMPTZ(3),

    CONSTRAINT "reseller_orders_pkey" PRIMARY KEY ("order_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resellers_portal_code_key" ON "resellers"("portal_code");

-- CreateIndex
CREATE INDEX "resellers_store_id_idx" ON "resellers"("store_id");

-- CreateIndex
CREATE INDEX "reseller_products_store_id_idx" ON "reseller_products"("store_id");

-- CreateIndex
CREATE INDEX "reseller_orders_reseller_id_created_at_idx" ON "reseller_orders"("reseller_id", "created_at");

-- AddForeignKey
ALTER TABLE "reseller_orders" ADD CONSTRAINT "reseller_orders_reseller_id_fkey" FOREIGN KEY ("reseller_id") REFERENCES "resellers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

