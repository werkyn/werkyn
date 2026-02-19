export const queryKeys = {
  me: ["me"] as const,
  workspaces: ["workspaces"] as const,
  workspace: (wid: string) => ["workspaces", wid] as const,
  workspaceMembers: (wid: string) => ["workspaces", wid, "members"] as const,
  projects: (wid: string) => ["projects", { wid }] as const,
  project: (pid: string) => ["projects", pid] as const,
  projectMembers: (pid: string) => ["projects", pid, "members"] as const,
  statuses: (pid: string) => ["projects", pid, "statuses"] as const,
  labels: (pid: string) => ["projects", pid, "labels"] as const,
  customFields: (pid: string) => ["projects", pid, "custom-fields"] as const,
  tasks: (pid: string, filters?: Record<string, unknown>) =>
    ["tasks", { pid, ...filters }] as const,
  task: (tid: string) => ["tasks", tid] as const,
  subtasks: (tid: string) => ["tasks", tid, "subtasks"] as const,
  comments: (tid: string) => ["tasks", tid, "comments"] as const,
  activity: (tid: string) => ["tasks", tid, "activity"] as const,
  dashboard: (wid: string) => ["workspaces", wid, "dashboard"] as const,
  myTasks: (wid: string) => ["my-tasks", { wid }] as const,
  search: (wid: string, q: string) => ["search", { wid, q }] as const,
  invites: (wid: string) => ["workspaces", wid, "invites"] as const,
  templates: (pid: string) => ["projects", pid, "templates"] as const,
  recurring: (pid: string) => ["projects", pid, "recurring"] as const,
  notifications: ["notifications"] as const,
  notificationUnreadCount: ["notifications", "unread-count"] as const,
  notificationPreferences: ["notifications", "preferences"] as const,
  files: (wid: string, parentId?: string | null, teamFolderId?: string) =>
    ["files", { wid, parentId: parentId ?? null, teamFolderId: teamFolderId ?? null }] as const,
  trashedFiles: (wid: string) =>
    ["files", { wid, trashed: true }] as const,
  fileBreadcrumbs: (wid: string, fid: string) =>
    ["files", { wid, fid, breadcrumbs: true }] as const,
  teamFolders: (wid: string) =>
    ["team-folders", { wid }] as const,
  teamFolder: (wid: string, tfid: string) =>
    ["team-folders", { wid, tfid }] as const,
  attachments: (entityType: string, entityId: string) =>
    ["attachments", { entityType, entityId }] as const,
  groups: (wid: string) => ["groups", { wid }] as const,
  group: (wid: string, gid: string) => ["groups", { wid, gid }] as const,
  workspaceSettings: (wid: string) => ["workspaces", wid, "settings"] as const,
  wikiSpaces: (wid: string) => ["wiki-spaces", { wid }] as const,
  wikiSpace: (sid: string) => ["wiki-spaces", sid] as const,
  wikiPageTree: (sid: string, parentId?: string) =>
    ["wiki-pages", { sid, parentId: parentId ?? null, tree: true }] as const,
  wikiPage: (pgid: string) => ["wiki-pages", pgid] as const,
  wikiPageBreadcrumbs: (pgid: string) =>
    ["wiki-pages", pgid, "breadcrumbs"] as const,
  timeEntries: (wid: string, startDate: string, endDate: string, userId?: string) =>
    ["time-entries", { wid, startDate, endDate, userId: userId ?? null }] as const,
  timeReport: (wid: string, filters?: Record<string, unknown>) =>
    ["time-report", { wid, ...filters }] as const,
  userRates: (wid: string) => ["user-rates", { wid }] as const,
  userRate: (wid: string, uid: string) => ["user-rates", { wid, uid }] as const,
};
