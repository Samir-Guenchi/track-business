-- CreateIndex
CREATE INDEX "orders_customer_phone_status_idx" ON "orders"("customer_phone", "status");
