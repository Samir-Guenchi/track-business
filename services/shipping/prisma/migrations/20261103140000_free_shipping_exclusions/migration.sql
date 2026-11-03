-- Free delivery excluded in far wilayas (#194).
ALTER TABLE "store_shipping_settings"
  ADD COLUMN "free_shipping_excluded_wilayas" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];
