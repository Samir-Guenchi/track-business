-- Live selling sessions and reservations (#199).
CREATE TABLE "live_sessions" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "products" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "live_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "live_reservations" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "code" TEXT NOT NULL,
    "size" TEXT,
    "quantity" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "order_id" TEXT,

    CONSTRAINT "live_reservations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "live_sessions_store_id_created_at_idx" ON "live_sessions"("store_id", "created_at");

CREATE UNIQUE INDEX "live_reservations_session_id_phone_code_key" ON "live_reservations"("session_id", "phone", "code");

ALTER TABLE "live_reservations" ADD CONSTRAINT "live_reservations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
