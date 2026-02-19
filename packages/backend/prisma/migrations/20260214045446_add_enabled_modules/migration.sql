-- AlterTable
ALTER TABLE "WorkspaceSettings" ADD COLUMN     "enabledModules" TEXT[] DEFAULT ARRAY['drive', 'wiki', 'time']::TEXT[];
