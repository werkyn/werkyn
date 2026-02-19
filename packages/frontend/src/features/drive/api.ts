import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/stores/auth-store";

export interface DriveFile {
  id: string;
  workspaceId: string;
  parentId: string | null;
  name: string;
  isFolder: boolean;
  mimeType: string | null;
  size: number | null;
  storagePath: string | null;
  uploadedById: string;
  ownerId: string | null;
  teamFolderId: string | null;
  trashedAt: string | null;
  createdAt: string;
  updatedAt: string;
  uploadedBy: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export interface BreadcrumbItem {
  id: string;
  name: string;
}

export interface TeamFolder {
  id: string;
  workspaceId: string;
  folderId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  folder: { id: string; name: string };
  _count: { members: number };
}

export interface TeamFolderMember {
  id: string;
  teamFolderId: string;
  userId: string;
  addedAt: string;
  user: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
  };
}

export interface TeamFolderDetail extends TeamFolder {
  members: TeamFolderMember[];
}

interface FilesResponse {
  data: DriveFile[];
  nextCursor: string | null;
}

// ── File Queries ──

export function useFiles(wid: string, parentId?: string | null, teamFolderId?: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.files(wid, parentId, teamFolderId),
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const params = new URLSearchParams();
      if (parentId) params.set("parentId", parentId);
      if (teamFolderId) params.set("teamFolderId", teamFolderId);
      if (pageParam) params.set("cursor", pageParam);
      params.set("limit", "50");

      const qs = params.toString();
      return api
        .get(`workspaces/${wid}/files${qs ? `?${qs}` : ""}`)
        .json<FilesResponse>();
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useTrashedFiles(wid: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.trashedFiles(wid),
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const params = new URLSearchParams();
      params.set("trashed", "true");
      params.set("limit", "50");
      if (pageParam) params.set("cursor", pageParam);

      return api
        .get(`workspaces/${wid}/files?${params.toString()}`)
        .json<FilesResponse>();
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useBreadcrumbs(wid: string, folderId?: string) {
  return useQuery({
    queryKey: queryKeys.fileBreadcrumbs(wid, folderId!),
    queryFn: () =>
      api
        .get(`workspaces/${wid}/files/${folderId}/breadcrumbs`)
        .json<{ data: BreadcrumbItem[] }>(),
    enabled: !!folderId,
  });
}

// ── Team Folder Queries ──

export function useTeamFolders(wid: string) {
  return useQuery({
    queryKey: queryKeys.teamFolders(wid),
    queryFn: () =>
      api
        .get(`workspaces/${wid}/team-folders`)
        .json<{ data: TeamFolder[] }>(),
    enabled: !!wid,
  });
}

export function useTeamFolder(wid: string, tfid: string) {
  return useQuery({
    queryKey: queryKeys.teamFolder(wid, tfid),
    queryFn: () =>
      api
        .get(`workspaces/${wid}/team-folders/${tfid}`)
        .json<{ data: TeamFolderDetail }>(),
    enabled: !!wid && !!tfid,
  });
}

// ── File Mutations ──

export function useCreateFolder(wid: string, parentId?: string | null, teamFolderId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api
        .post(`workspaces/${wid}/files/folder`, {
          json: {
            name,
            parentId: parentId || undefined,
            teamFolderId: teamFolderId || undefined,
          },
        })
        .json<{ data: DriveFile }>(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.files(wid, parentId, teamFolderId) });
    },
  });
}

export function uploadSingleFile(
  wid: string,
  file: File,
  parentId?: string | null,
  onProgress?: (loaded: number, total: number) => void,
): Promise<DriveFile> {
  return new Promise((resolve, reject) => {
    const token = useAuthStore.getState().accessToken;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

    const formData = new FormData();
    formData.append("file", file);
    if (parentId) formData.append("parentId", parentId);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${baseUrl}/workspaces/${wid}/files/upload`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(e.loaded, e.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText) as { data: DriveFile };
          resolve(json.data);
        } catch {
          reject(new Error(`Invalid response for: ${file.name}`));
        }
      } else {
        try {
          const body = JSON.parse(xhr.responseText);
          reject(new Error((body as { message?: string }).message || `Upload failed: ${file.name}`));
        } catch {
          reject(new Error(`Upload failed: ${file.name}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error(`Upload failed: ${file.name}`));
    xhr.send(formData);
  });
}

export function useInvalidateFiles(wid: string, parentId?: string | null, teamFolderId?: string) {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: queryKeys.files(wid, parentId, teamFolderId) });
}

export function useRenameFile(wid: string, parentId?: string | null, teamFolderId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ fileId, name }: { fileId: string; name: string }) =>
      api
        .patch(`workspaces/${wid}/files/${fileId}`, { json: { name } })
        .json<{ data: DriveFile }>(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.files(wid, parentId, teamFolderId) });
    },
  });
}

export function useMoveFile(wid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      fileId,
      parentId,
    }: {
      fileId: string;
      parentId: string | null;
    }) =>
      api
        .patch(`workspaces/${wid}/files/${fileId}`, { json: { parentId } })
        .json<{ data: DriveFile }>(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

export function useTrashFile(wid: string, parentId?: string | null, teamFolderId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fileId: string) =>
      api
        .patch(`workspaces/${wid}/files/${fileId}`, {
          json: { trashedAt: new Date().toISOString() },
        })
        .json<{ data: DriveFile }>(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.files(wid, parentId, teamFolderId) });
    },
  });
}

export function useRestoreFile(wid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fileId: string) =>
      api
        .patch(`workspaces/${wid}/files/${fileId}`, {
          json: { trashedAt: null },
        })
        .json<{ data: DriveFile }>(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

export function useDeleteFilePermanently(wid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fileId: string) =>
      api.delete(`workspaces/${wid}/files/${fileId}`).then(() => {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

export function useFileAttachmentCount(wid: string, fileId: string | null) {
  return useQuery({
    queryKey: ["files", { wid, fileId, attachmentCount: true }],
    queryFn: () =>
      api
        .get(`workspaces/${wid}/files/${fileId}/attachments-count`)
        .json<{ data: { count: number } }>(),
    enabled: !!fileId,
  });
}

export function useDownloadFile(wid: string) {
  return async (fileId: string, fileName: string) => {
    const token = useAuthStore.getState().accessToken;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

    const response = await fetch(
      `${baseUrl}/workspaces/${wid}/files/${fileId}/download`,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      },
    );

    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    // Force generic type so the browser respects the filename extension
    // instead of inferring one from the MIME type (e.g. .qt for video/quicktime)
    const downloadBlob = new Blob([blob], { type: "application/octet-stream" });
    const url = URL.createObjectURL(downloadBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
}

// ── Team Folder Mutations ──

export function useCreateTeamFolder(wid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; description?: string; memberIds?: string[] }) =>
      api
        .post(`workspaces/${wid}/team-folders`, { json: input })
        .json<{ data: TeamFolder }>(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teamFolders(wid) });
    },
  });
}

export function useUpdateTeamFolder(wid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      tfid,
      ...input
    }: {
      tfid: string;
      name?: string;
      description?: string | null;
    }) =>
      api
        .patch(`workspaces/${wid}/team-folders/${tfid}`, { json: input })
        .json<{ data: TeamFolder }>(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teamFolders(wid) });
    },
  });
}

export function useDeleteTeamFolder(wid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tfid: string) =>
      api.delete(`workspaces/${wid}/team-folders/${tfid}`).then(() => {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teamFolders(wid) });
    },
  });
}

export function useAddTeamFolderMember(wid: string, tfid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api
        .post(`workspaces/${wid}/team-folders/${tfid}/members`, {
          json: { userId },
        })
        .json<{ data: TeamFolderMember }>(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teamFolder(wid, tfid) });
      qc.invalidateQueries({ queryKey: queryKeys.teamFolders(wid) });
    },
  });
}

export function useRemoveTeamFolderMember(wid: string, tfid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api
        .delete(`workspaces/${wid}/team-folders/${tfid}/members/${userId}`)
        .then(() => {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teamFolder(wid, tfid) });
      qc.invalidateQueries({ queryKey: queryKeys.teamFolders(wid) });
    },
  });
}
