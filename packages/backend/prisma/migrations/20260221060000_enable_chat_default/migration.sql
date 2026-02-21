-- Update schema default for enabledModules to include "chat"
ALTER TABLE "WorkspaceSettings" ALTER COLUMN "enabledModules" SET DEFAULT ARRAY['drive', 'wiki', 'time', 'chat']::TEXT[];

-- Add "chat" to existing workspaces that don't already have it
UPDATE "WorkspaceSettings"
SET "enabledModules" = array_append("enabledModules", 'chat')
WHERE NOT ('chat' = ANY("enabledModules"));
