-- Partner pickup points in local shops (#202).
CREATE TABLE "pickup_points" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "wilaya_code" INTEGER NOT NULL,
    "commune_id" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "hours" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "capacity" INTEGER NOT NULL,
    "fee_per_parcel" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pickup_points_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pickup_parcels" (
    "shipment_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "point_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "fee" INTEGER NOT NULL,
    "dropped_at" TIMESTAMPTZ(3) NOT NULL,
    "released_at" TIMESTAMPTZ(3),
    "cash_collected" INTEGER,
    "handed_over_at" TIMESTAMPTZ(3),

    CONSTRAINT "pickup_parcels_pkey" PRIMARY KEY ("shipment_id")
);

CREATE INDEX "pickup_points_store_id_commune_id_idx" ON "pickup_points"("store_id", "commune_id");

CREATE INDEX "pickup_parcels_point_id_released_at_idx" ON "pickup_parcels"("point_id", "released_at");

ALTER TABLE "pickup_parcels" ADD CONSTRAINT "pickup_parcels_point_id_fkey" FOREIGN KEY ("point_id") REFERENCES "pickup_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
