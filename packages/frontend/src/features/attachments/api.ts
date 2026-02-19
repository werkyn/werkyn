import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/stores/auth-store";

export interface Attachment {
  id: string;
  workspaceId: string;
  entityType: string;
  entityId: string;
  name: string;
  mimeType: string | null;
  size: number;
  storagePath: string;
  uploadedById: string;
  fileId: string | null;
  createdAt: string;
  uploadedBy: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  file?: {
    id: string;
    name: string;
    trashedAt: string | null;
  } | null;
}

export function useAttachments(
  wid: string,
  entityType: string,
  entityId: string,
) {
  return useQuery({
    queryKey: queryKeys.attachments(entityType, entityId),
    queryFn: () =>
      api
        .get(
          `workspaces/${wid}/attachments?entityType=${entityType}&entityId=${entityId}`,
        )
        .json<{ data: Attachment[] }>(),
  });
}

export function useUploadAttachment(
  wid: string,
  entityType: string,
  entityId: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const token = useAuthStore.getState().accessToken;
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", entityType);
      formData.append("entityId", entityId);

      const response = await fetch(
        `${baseUrl}/workspaces/${wid}/attachments`,
        {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          body: formData,
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          (body as { message?: string }).message || "Upload failed",
        );
      }

      return response.json() as Promise<{ data: Attachment }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: queryKeys.attachments(entityType, entityId),
      });
    },
  });
}

export function useDeleteAttachment(
  wid: string,
  entityType: string,
  entityId: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) =>
      api
        .delete(`workspaces/${wid}/attachments/${attachmentId}`)
        .then(() => {}),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: queryKeys.attachments(entityType, entityId),
      });
    },
  });
}

export function useLinkAttachment(
  wid: string,
  entityType: string,
  entityId: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fileId: string) =>
      api
        .post(`workspaces/${wid}/attachments/link`, {
          json: { entityType, entityId, fileId },
        })
        .json<{ data: Attachment }>(),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: queryKeys.attachments(entityType, entityId),
      });
    },
  });
}

export function useDownloadAttachment(wid: string) {
  return async (attachmentId: string, fileName: string) => {
    const token = useAuthStore.getState().accessToken;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

    const response = await fetch(
      `${baseUrl}/workspaces/${wid}/attachments/${attachmentId}/download`,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      },
    );

    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
}
