-- CreateTable
CREATE TABLE "imported_orders" (
    "connection_id" UUID NOT NULL,
    "external_id" TEXT NOT NULL,
    "store_id" UUID NOT NULL,
    "external_name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "problem" TEXT,
    "pending" JSONB,
    "shop_updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "imported_orders_pkey" PRIMARY KEY ("connection_id","external_id")
);

-- CreateIndex
CREATE INDEX "imported_orders_store_id_state_created_at_idx" ON "imported_orders"("store_id", "state", "created_at");

-- AddForeignKey
ALTER TABLE "imported_orders" ADD CONSTRAINT "imported_orders_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "shop_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
