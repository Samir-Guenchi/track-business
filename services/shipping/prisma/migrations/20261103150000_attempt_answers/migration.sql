-- The customer's word on failed delivery attempts (#195).
CREATE TABLE "attempt_answers" (
    "tracking_event_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "shipment_id" UUID NOT NULL,
    "carrier" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "attempt_at" TIMESTAMPTZ(3) NOT NULL,
    "answer" TEXT NOT NULL,
    "answered_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "attempt_answers_pkey" PRIMARY KEY ("tracking_event_id")
);

CREATE INDEX "attempt_answers_store_id_answered_at_idx" ON "attempt_answers"("store_id", "answered_at");
