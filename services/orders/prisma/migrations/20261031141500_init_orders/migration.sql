-- Trigram index for order search (ref, customer name, tracking number).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "store_id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor_type" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "ip" TEXT,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "ref" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "external_ref" TEXT,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "customer_phone2" TEXT,
    "wilaya_code" INTEGER NOT NULL,
    "commune_id" INTEGER NOT NULL,
    "address" TEXT,
    "delivery_type" TEXT NOT NULL,
    "stop_desk_id" TEXT,
    "subtotal" INTEGER NOT NULL,
    "shipping_fee" INTEGER NOT NULL,
    "discount" INTEGER NOT NULL,
    "cod_amount" INTEGER NOT NULL,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "assigned_agent_id" TEXT,
    "carrier" TEXT,
    "tracking_number" TEXT,
    "possible_duplicate_of_id" UUID,
    "items_fingerprint" TEXT NOT NULL,
    "search_text" TEXT NOT NULL,
    "postponed_until" TIMESTAMPTZ(3),
    "status_changed_at" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "product_id" TEXT,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit_price" INTEGER NOT NULL,
    "line_total" INTEGER NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "store_id" TEXT,
    "correlation_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "published_at" TIMESTAMPTZ(3),

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_events_store_id_entity_entity_id_occurred_at_idx" ON "audit_events"("store_id", "entity", "entity_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "audit_events_occurred_at_idx" ON "audit_events"("occurred_at");

-- CreateIndex
CREATE INDEX "orders_store_id_created_at_id_idx" ON "orders"("store_id", "created_at" DESC, "id");

-- CreateIndex
CREATE INDEX "orders_store_id_status_created_at_idx" ON "orders"("store_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "orders_store_id_customer_phone_created_at_idx" ON "orders"("store_id", "customer_phone", "created_at" DESC);

-- CreateIndex
CREATE INDEX "orders_store_id_wilaya_code_idx" ON "orders"("store_id", "wilaya_code");

-- CreateIndex
CREATE INDEX "orders_store_id_assigned_agent_id_idx" ON "orders"("store_id", "assigned_agent_id");

-- CreateIndex
CREATE INDEX "orders_tags_idx" ON "orders" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "orders_search_text_idx" ON "orders" USING GIN ("search_text" gin_trgm_ops);

-- CreateIndex
CREATE UNIQUE INDEX "orders_store_id_ref_key" ON "orders"("store_id", "ref");

-- CreateIndex
CREATE UNIQUE INDEX "orders_store_id_source_external_ref_key" ON "orders"("store_id", "source", "external_ref");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "outbox_events_published_at_occurred_at_idx" ON "outbox_events"("published_at", "occurred_at");

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

