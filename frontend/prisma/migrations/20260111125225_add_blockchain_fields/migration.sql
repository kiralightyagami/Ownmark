/*
  Warnings:

  - A unique constraint covering the columns `[contentId]` on the table `product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[accessMintAddress]` on the table `product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[splitStateAddress]` on the table `product` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "product" ADD COLUMN     "accessMintAddress" TEXT,
ADD COLUMN     "contentId" TEXT,
ADD COLUMN     "platformFeeBps" INTEGER DEFAULT 200,
ADD COLUMN     "seed" BIGINT DEFAULT 1,
ADD COLUMN     "splitStateAddress" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "product_contentId_key" ON "product"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "product_accessMintAddress_key" ON "product"("accessMintAddress");

-- CreateIndex
CREATE UNIQUE INDEX "product_splitStateAddress_key" ON "product"("splitStateAddress");

-- CreateIndex
CREATE INDEX "product_contentId_idx" ON "product"("contentId");
