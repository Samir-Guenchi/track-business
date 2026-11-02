-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "landmark" TEXT,
ADD COLUMN     "location_accuracy_m" INTEGER,
ADD COLUMN     "location_lat" DOUBLE PRECISION,
ADD COLUMN     "location_lng" DOUBLE PRECISION,
ADD COLUMN     "location_set_at" TIMESTAMPTZ(3),
ADD COLUMN     "location_source" TEXT;
