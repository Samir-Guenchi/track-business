-- Customer return and exchange requests from the tracking page (#201).
CREATE TABLE "return_requests" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "shipment_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "wanted" TEXT,
    "note" TEXT,
    "state" TEXT NOT NULL,
    "seller_message" TEXT,
    "new_order_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "decided_at" TIMESTAMPTZ(3),

    CONSTRAINT "return_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "return_requests_shipment_id_key" ON "return_requests"("shipment_id");

CREATE INDEX "return_requests_store_id_state_created_at_idx" ON "return_requests"("store_id", "state", "created_at");
