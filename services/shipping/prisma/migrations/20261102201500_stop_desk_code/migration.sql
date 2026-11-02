-- AlterTable
ALTER TABLE "stop_desks" ADD COLUMN     "code" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "stop_desks_carrier_code_key" ON "stop_desks"("carrier", "code");
