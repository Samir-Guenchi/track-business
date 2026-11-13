-- CreateTable
CREATE TABLE "notification_settings" (
    "store_id" UUID NOT NULL,
    "settings" JSONB NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("store_id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "store_id" UUID NOT NULL,
    "trigger" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("store_id","trigger","channel","language")
);

-- CreateTable
CREATE TABLE "opt_outs" (
    "store_id" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "opt_outs_pkey" PRIMARY KEY ("store_id","phone")
);

-- CreateTable
CREATE TABLE "parcels" (
    "shipment_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "carrier" TEXT NOT NULL,
    "public_code" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "parcels_pkey" PRIMARY KEY ("shipment_id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "trigger" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "skip_reason" TEXT,
    "source_event_id" TEXT NOT NULL,
    "shipment_id" UUID,
    "send_after" TIMESTAMPTZ(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(3),
    "provider" TEXT,
    "provider_id" TEXT,
    "cost_centimes" INTEGER,
    "last_error" TEXT,
    "queued_at" TIMESTAMPTZ(3) NOT NULL,
    "sent_at" TIMESTAMPTZ(3),
    "delivered_at" TIMESTAMPTZ(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parcels_store_id_order_id_idx" ON "parcels"("store_id", "order_id");

-- CreateIndex
CREATE INDEX "messages_status_send_after_idx" ON "messages"("status", "send_after");

-- CreateIndex
CREATE INDEX "messages_store_id_queued_at_id_idx" ON "messages"("store_id", "queued_at" DESC, "id");

-- CreateIndex
CREATE INDEX "messages_store_id_order_id_idx" ON "messages"("store_id", "order_id");

-- CreateIndex
CREATE UNIQUE INDEX "messages_source_event_id_trigger_key" ON "messages"("source_event_id", "trigger");

-- CreateIndex
CREATE UNIQUE INDEX "messages_provider_provider_id_key" ON "messages"("provider", "provider_id");
