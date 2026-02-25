import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import type { BackupExportRequest, RestoreSummary } from "@pm/shared";

export function useExportBackup(wid: string) {
  return useMutation({
    mutationFn: async (data: BackupExportRequest) => {
      const token = useAuthStore.getState().accessToken;
      const baseUrl =
        (import.meta.env.VITE_API_BASE_URL as string | undefined) || "/api";
      const response = await fetch(`${baseUrl}/workspaces/${wid}/backup/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          (body as any).message || "Export failed",
        );
      }
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] ?? "backup.json";
      return { blob, filename };
    },
  });
}

export function usePreviewRestore(wid: string) {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api
        .post(`workspaces/${wid}/backup/preview`, { body: formData, timeout: 60_000 })
        .json<{ data: RestoreSummary }>();
      return res.data;
    },
  });
}

export function useExecuteRestore(wid: string) {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api
        .post(`workspaces/${wid}/backup/restore`, { body: formData, timeout: 120_000 })
        .json<{ data: RestoreSummary }>();
      return res.data;
    },
  });
}
