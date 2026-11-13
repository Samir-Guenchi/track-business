-- Per-store anti-spam limits for order forms (#134), never looser than the platform's.
CREATE TABLE "order_form_limits" (
    "store_id" UUID NOT NULL,
    "per_ip_per_hour" INTEGER NOT NULL,
    "per_phone_per_hour" INTEGER NOT NULL,
    "duplicate_window_hours" INTEGER NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "order_form_limits_pkey" PRIMARY KEY ("store_id")
);
