import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type {
  CreateGroupInput,
  UpdateGroupInput,
  UpdateWorkspaceSettingsInput,
} from "@pm/shared";

// ─── Group Types ───

export interface GroupSummary {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { members: number };
}

export interface GroupMemberInfo {
  id: string;
  groupId: string;
  userId: string;
  addedAt: string;
  user: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
  };
}

export interface TeamFolderGroupInfo {
  id: string;
  teamFolderId: string;
  groupId: string;
  teamFolder: { id: string; name: string };
}

export interface GroupDetail extends GroupSummary {
  members: GroupMemberInfo[];
  teamFolderGroups: TeamFolderGroupInfo[];
}

// ─── Workspace Settings Type ───

export interface WorkspaceSettings {
  id: string;
  workspaceId: string;
  defaultRole: "ADMIN" | "MEMBER" | "VIEWER";
  invitesEnabled: boolean;
  requireAdminApproval: boolean;
  allowedEmailDomains: string[];
  maxMembers: number | null;
  enabledModules: string[];
  updatedAt: string;
}

// ─── Group Hooks ───

export function useGroups(wid: string) {
  return useQuery({
    queryKey: queryKeys.groups(wid),
    queryFn: () =>
      api.get(`workspaces/${wid}/groups`).json<{ data: GroupSummary[] }>(),
    enabled: !!wid,
  });
}

export function useGroup(wid: string, gid: string) {
  return useQuery({
    queryKey: queryKeys.group(wid, gid),
    queryFn: () =>
      api.get(`workspaces/${wid}/groups/${gid}`).json<{ data: GroupDetail }>(),
    enabled: !!wid && !!gid,
  });
}

export function useCreateGroup(wid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGroupInput) =>
      api
        .post(`workspaces/${wid}/groups`, { json: data })
        .json<{ data: GroupSummary }>(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.groups(wid) });
    },
  });
}

export function useUpdateGroup(wid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gid, ...data }: UpdateGroupInput & { gid: string }) =>
      api
        .patch(`workspaces/${wid}/groups/${gid}`, { json: data })
        .json<{ data: GroupSummary }>(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.groups(wid) });
    },
  });
}

export function useDeleteGroup(wid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (gid: string) =>
      api.delete(`workspaces/${wid}/groups/${gid}`).then(() => {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.groups(wid) });
    },
  });
}

export function useAddGroupMember(wid: string, gid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api
        .post(`workspaces/${wid}/groups/${gid}/members`, {
          json: { userId },
        })
        .json<{ data: GroupMemberInfo }>(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.group(wid, gid) });
      qc.invalidateQueries({ queryKey: queryKeys.groups(wid) });
    },
  });
}

export function useRemoveGroupMember(wid: string, gid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api
        .delete(`workspaces/${wid}/groups/${gid}/members/${userId}`)
        .then(() => {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.group(wid, gid) });
      qc.invalidateQueries({ queryKey: queryKeys.groups(wid) });
    },
  });
}

// ─── Workspace Settings Hooks ───

export function useWorkspaceSettings(wid: string) {
  return useQuery({
    queryKey: queryKeys.workspaceSettings(wid),
    queryFn: () =>
      api
        .get(`workspaces/${wid}/settings`)
        .json<{ data: WorkspaceSettings }>(),
    enabled: !!wid,
  });
}

export function useUpdateWorkspaceSettings(wid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateWorkspaceSettingsInput) =>
      api
        .patch(`workspaces/${wid}/settings`, { json: data })
        .json<{ data: WorkspaceSettings }>(),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: queryKeys.workspaceSettings(wid),
      });
    },
  });
}

// ─── Team Folder Group Hooks ───

export function useAddTeamFolderGroup(wid: string, tfid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) =>
      api
        .post(`workspaces/${wid}/team-folders/${tfid}/groups`, {
          json: { groupId },
        })
        .json(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teamFolder(wid, tfid) });
      qc.invalidateQueries({ queryKey: queryKeys.teamFolders(wid) });
    },
  });
}

export function useRemoveTeamFolderGroup(wid: string, tfid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) =>
      api
        .delete(`workspaces/${wid}/team-folders/${tfid}/groups/${groupId}`)
        .then(() => {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teamFolder(wid, tfid) });
      qc.invalidateQueries({ queryKey: queryKeys.teamFolders(wid) });
    },
  });
}
