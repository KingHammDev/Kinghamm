/*
  Warnings:

  - Added the required column `doc_date` to the `ClothesAdj` table without a default value. This is not possible if the table is not empty.
  - Added the required column `doc_date` to the `ClothesIn` table without a default value. This is not possible if the table is not empty.
  - Added the required column `doc_date` to the `ClothesOut` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ClothesAdj" ADD COLUMN     "doc_date" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT TIMEZONE('Asia/Taipei', NOW());

-- AlterTable
ALTER TABLE "ClothesIn" ADD COLUMN     "doc_date" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT TIMEZONE('Asia/Taipei', NOW());

-- AlterTable
ALTER TABLE "ClothesOut" ADD COLUMN     "doc_date" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT TIMEZONE('Asia/Taipei', NOW());

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "createdAt" SET DEFAULT TIMEZONE('Asia/Taipei', NOW());
