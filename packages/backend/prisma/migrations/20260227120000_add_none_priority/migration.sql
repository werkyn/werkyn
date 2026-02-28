-- AlterEnum
ALTER TYPE "Priority" ADD VALUE 'NONE' BEFORE 'LOW';

-- AlterTable: change default for Task.priority
ALTER TABLE "Task" ALTER COLUMN "priority" SET DEFAULT 'NONE';

-- AlterTable: change default for TaskTemplate.priority
ALTER TABLE "TaskTemplate" ALTER COLUMN "priority" SET DEFAULT 'NONE';
