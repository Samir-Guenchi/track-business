-- CreateTable
CREATE TABLE "form_submissions" (
    "id" UUID NOT NULL,
    "form_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "order_id" UUID,
    "outcome" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "ip_hash" TEXT NOT NULL,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "utm_content" TEXT,
    "utm_term" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "form_submissions_ip_hash_created_at_idx" ON "form_submissions"("ip_hash", "created_at");

-- CreateIndex
CREATE INDEX "form_submissions_store_id_phone_created_at_idx" ON "form_submissions"("store_id", "phone", "created_at");

-- CreateIndex
CREATE INDEX "form_submissions_form_id_created_at_idx" ON "form_submissions"("form_id", "created_at");
