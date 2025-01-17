-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "faId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT TIMEZONE('Asia/Taipei', NOW()),
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClothesIn" (
    "c_in_no" TEXT NOT NULL,
    "c_in_id" INTEGER NOT NULL,
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

-- CreateTable
CREATE TABLE "ClothesOut" (
    "c_out_no" TEXT NOT NULL,
    "c_out_id" INTEGER NOT NULL,
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

-- CreateTable
CREATE TABLE "ClothesAdj" (
    "c_adj_no" TEXT NOT NULL,
    "c_adj_id" INTEGER NOT NULL,
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
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ClothesIn_c_in_no_c_in_id_key" ON "ClothesIn"("c_in_no", "c_in_id");

-- CreateIndex
CREATE UNIQUE INDEX "ClothesOut_c_out_no_c_out_id_key" ON "ClothesOut"("c_out_no", "c_out_id");

-- CreateIndex
CREATE UNIQUE INDEX "ClothesAdj_c_adj_no_c_adj_id_key" ON "ClothesAdj"("c_adj_no", "c_adj_id");
