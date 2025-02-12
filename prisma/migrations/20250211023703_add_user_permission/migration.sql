-- AlterTable
ALTER TABLE "ClothesAdj" ALTER COLUMN "created_at" SET DEFAULT TIMEZONE('Asia/Taipei', NOW());

-- AlterTable
ALTER TABLE "ClothesIn" ALTER COLUMN "created_at" SET DEFAULT TIMEZONE('Asia/Taipei', NOW());

-- AlterTable
ALTER TABLE "ClothesOut" ALTER COLUMN "created_at" SET DEFAULT TIMEZONE('Asia/Taipei', NOW());

-- AlterTable
ALTER TABLE "MonthlyBalance" ALTER COLUMN "created_at" SET DEFAULT TIMEZONE('Asia/Taipei', NOW());

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "createdAt" SET DEFAULT TIMEZONE('Asia/Taipei', NOW());

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "moduleId" TEXT NOT NULL,
    "actions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT TIMEZONE('Asia/Taipei', NOW()),
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_moduleId_key" ON "UserPermission"("userId", "moduleId");

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
