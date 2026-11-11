-- DropForeignKey
ALTER TABLE "WearLog" DROP CONSTRAINT "WearLog_itemId_fkey";

-- AddForeignKey
ALTER TABLE "WearLog" ADD CONSTRAINT "WearLog_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

