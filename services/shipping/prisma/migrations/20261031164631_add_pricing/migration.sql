-- CreateTable
CREATE TABLE "store_prices" (
    "store_id" UUID NOT NULL,
    "wilaya_code" INTEGER NOT NULL,
    "delivery_type" TEXT NOT NULL,
    "price" INTEGER,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "store_prices_pkey" PRIMARY KEY ("store_id","wilaya_code","delivery_type")
);

-- CreateTable
CREATE TABLE "store_shipping_settings" (
    "store_id" UUID NOT NULL,
    "free_shipping_from" INTEGER,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "store_shipping_settings_pkey" PRIMARY KEY ("store_id")
);

-- CreateTable
CREATE TABLE "rate_cards" (
    "store_id" UUID NOT NULL,
    "carrier" TEXT NOT NULL,
    "from_wilaya" INTEGER NOT NULL,
    "to_wilaya" INTEGER NOT NULL,
    "delivery_type" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "return_fee" INTEGER NOT NULL,
    "weight_limit_grams" INTEGER,
    "imported_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "rate_cards_pkey" PRIMARY KEY ("store_id","carrier","from_wilaya","to_wilaya","delivery_type")
);
