import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@/lib/api-client";
import { queryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  UpdateWorkspaceMemberInput,
  CreateInviteInput,
} from "@pm/shared";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { members: number; projects: number };
}

interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: "ADMIN" | "MEMBER" | "VIEWER";
  joinedAt: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export function useCreateWorkspace() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: CreateWorkspaceInput) =>
      api.post("workspaces", { json: data }).json<{ data: Workspace }>(),
    onSuccess: async (res) => {
      await useAuthStore.getState().refresh();
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      toast.success("Workspace created");
      navigate({
        to: "/$workspaceSlug",
        params: { workspaceSlug: res.data.slug },
      });
    },
  });
}

export function useUpdateWorkspace(wid: string) {
  return useMutation({
    mutationFn: (data: UpdateWorkspaceInput) =>
      api
        .patch(`workspaces/${wid}`, { json: data })
        .json<{ data: Workspace }>(),
    onSuccess: async () => {
      await useAuthStore.getState().refresh();
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace(wid) });
      toast.success("Workspace updated");
    },
  });
}

export function useDeleteWorkspace(wid: string) {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => api.delete(`workspaces/${wid}`),
    onSuccess: async () => {
      await useAuthStore.getState().refresh();
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      toast.success("Workspace deleted");
      navigate({ to: "/" });
    },
  });
}

export function useWorkspaceMembers(wid: string) {
  return useQuery({
    queryKey: queryKeys.workspaceMembers(wid),
    queryFn: () =>
      api
        .get(`workspaces/${wid}/members`)
        .json<{ data: WorkspaceMember[] }>(),
    enabled: !!wid,
  });
}

export function useUpdateMemberRole(wid: string) {
  return useMutation({
    mutationFn: ({
      userId,
      ...data
    }: UpdateWorkspaceMemberInput & { userId: string }) =>
      api
        .patch(`workspaces/${wid}/members/${userId}`, { json: data })
        .json<{ data: WorkspaceMember }>(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workspaceMembers(wid),
      });
      toast.success("Role updated");
    },
  });
}

export function useRemoveMember(wid: string) {
  return useMutation({
    mutationFn: (userId: string) =>
      api.delete(`workspaces/${wid}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workspaceMembers(wid),
      });
      toast.success("Member removed");
    },
  });
}

// ─── Invites ────────────────────────────────────────────

interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  email: string | null;
  role: "ADMIN" | "MEMBER" | "VIEWER";
  token: string;
  expiresAt: string | null;
  maxUses: number | null;
  useCount: number;
  createdAt: string;
}

interface InviteDetails {
  id: string;
  workspace: { id: string; name: string; slug: string; logoUrl: string | null };
  role: "ADMIN" | "MEMBER" | "VIEWER";
  email: string | null;
}

export function useWorkspaceInvites(wid: string) {
  return useQuery({
    queryKey: queryKeys.invites(wid),
    queryFn: () =>
      api
        .get(`workspaces/${wid}/invites`)
        .json<{ data: WorkspaceInvite[] }>(),
    enabled: !!wid,
  });
}

export function useCreateInvite(wid: string) {
  return useMutation({
    mutationFn: (data: CreateInviteInput) =>
      api
        .post(`workspaces/${wid}/invites`, { json: data })
        .json<{ data: WorkspaceInvite }>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invites(wid) });
    },
  });
}

export function useRevokeInvite(wid: string) {
  return useMutation({
    mutationFn: (inviteId: string) => api.delete(`invites/${inviteId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invites(wid) });
      toast.success("Invite revoked");
    },
  });
}

export function useInviteDetails(token: string) {
  return useQuery({
    queryKey: ["invite", token],
    queryFn: () =>
      api.get(`invites/${token}`).json<{ data: InviteDetails }>(),
    enabled: !!token,
    retry: false,
  });
}

export function useAcceptInvite() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (token: string) =>
      api
        .post(`invites/${token}/accept`)
        .json<{ data: { id: string; slug: string; name: string } }>(),
    onSuccess: async (res) => {
      await useAuthStore.getState().refresh();
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      toast.success(`Joined ${res.data.name}`);
      navigate({
        to: "/$workspaceSlug",
        params: { workspaceSlug: res.data.slug },
      });
    },
  });
}
