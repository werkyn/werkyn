-- CreateEnum
CREATE TYPE "CustomFieldType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'SELECT', 'MULTI_SELECT', 'CHECKBOX', 'URL');

-- CreateTable
CREATE TABLE "CustomField" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "CustomFieldType" NOT NULL,
    "options" JSONB,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomFieldValue" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "CustomFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomField_projectId_idx" ON "CustomField"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomField_projectId_name_key" ON "CustomField"("projectId", "name");

-- CreateIndex
CREATE INDEX "CustomFieldValue_fieldId_idx" ON "CustomFieldValue"("fieldId");

-- CreateIndex
CREATE INDEX "CustomFieldValue_taskId_idx" ON "CustomFieldValue"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldValue_taskId_fieldId_key" ON "CustomFieldValue"("taskId", "fieldId");

-- AddForeignKey
ALTER TABLE "CustomField" ADD CONSTRAINT "CustomField_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "CustomField"("id") ON DELETE CASCADE ON UPDATE CASCADE;
