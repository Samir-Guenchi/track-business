-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "order_id" UUID NOT NULL,
    "order_ref" TEXT NOT NULL,
    "issued_at" TIMESTAMPTZ(3) NOT NULL,
    "content" JSONB NOT NULL,
    "credit_for_id" UUID,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_counters" (
    "store_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "last" INTEGER NOT NULL,

    CONSTRAINT "invoice_counters_pkey" PRIMARY KEY ("store_id","kind","year")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_credit_for_id_key" ON "invoices"("credit_for_id");

-- CreateIndex
CREATE INDEX "invoices_store_id_issued_at_idx" ON "invoices"("store_id", "issued_at");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_store_id_number_key" ON "invoices"("store_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_store_id_kind_order_id_key" ON "invoices"("store_id", "kind", "order_id");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_credit_for_id_fkey" FOREIGN KEY ("credit_for_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

