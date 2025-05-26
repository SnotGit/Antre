/*
  Warnings:

  - The values [dev] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `views` on the `stories` table. All the data in the column will be lost.
  - You are about to drop the column `word_count` on the `stories` table. All the data in the column will be lost.
  - You are about to drop the column `is_dev` on the `users` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('admin', 'user');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';
COMMIT;

-- AlterTable
ALTER TABLE "stories" DROP COLUMN "views",
DROP COLUMN "word_count";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "is_dev";
