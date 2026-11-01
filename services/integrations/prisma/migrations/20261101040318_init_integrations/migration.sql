-- CreateTable
CREATE TABLE "shop_connections" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "connector" TEXT NOT NULL,
    "shop_url" TEXT NOT NULL,
    "shop_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'connected',
    "kek_id" TEXT NOT NULL,
    "wrapped_key" BYTEA NOT NULL,
    "secret" BYTEA NOT NULL,
    "synced_through" TIMESTAMPTZ(3),
    "last_sync_at" TIMESTAMPTZ(3),
    "orders_imported" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "shop_connections_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "processed_events" (
    "consumer" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "processed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_events_pkey" PRIMARY KEY ("consumer","event_id")
);

-- CreateIndex
CREATE INDEX "shop_connections_status_last_sync_at_idx" ON "shop_connections"("status", "last_sync_at");

-- CreateIndex
CREATE UNIQUE INDEX "shop_connections_store_id_connector_shop_url_key" ON "shop_connections"("store_id", "connector", "shop_url");

-- CreateIndex
CREATE INDEX "outbox_events_published_at_occurred_at_idx" ON "outbox_events"("published_at", "occurred_at");
