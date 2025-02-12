-- AlterTable
ALTER TABLE "ClothesAdj" ALTER COLUMN "created_at" SET DEFAULT TIMEZONE('Asia/Taipei', NOW());

-- AlterTable
ALTER TABLE "ClothesIn" ALTER COLUMN "created_at" SET DEFAULT TIMEZONE('Asia/Taipei', NOW());

-- AlterTable
ALTER TABLE "ClothesOut" ALTER COLUMN "created_at" SET DEFAULT TIMEZONE('Asia/Taipei', NOW());

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "createdAt" SET DEFAULT TIMEZONE('Asia/Taipei', NOW());

-- CreateTable
CREATE TABLE "MonthlyBalance" (
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "fa_id" TEXT NOT NULL,
    "od_no" TEXT NOT NULL,
    "color_name" TEXT NOT NULL,
    "po" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT TIMEZONE('Asia/Taipei', NOW()),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "user_id" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyBalance_year_month_fa_id_od_no_color_name_po_size_key" ON "MonthlyBalance"("year", "month", "fa_id", "od_no", "color_name", "po", "size");
