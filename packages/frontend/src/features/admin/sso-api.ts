import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type {
  UpdateSsoConfigInput,
  CreateSsoConnectorInput,
  UpdateSsoConnectorInput,
} from "@pm/shared";

// ─── Types ───

export interface SsoConfig {
  id: string;
  enabled: boolean;
  passwordLoginEnabled: boolean;
  autoLinkByEmail: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SsoConnector {
  id: string;
  ssoConfigId: string;
  connectorId: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  enabled: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Hooks ───

export function useSsoConfig() {
  return useQuery({
    queryKey: queryKeys.ssoConfig,
    queryFn: () =>
      api.get("admin/sso/config").json<{ data: SsoConfig }>(),
  });
}

export function useUpdateSsoConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSsoConfigInput) =>
      api
        .patch("admin/sso/config", { json: data })
        .json<{ data: SsoConfig }>(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.ssoConfig });
      qc.invalidateQueries({ queryKey: queryKeys.ssoInfo });
    },
  });
}

export function useSsoConnectors() {
  return useQuery({
    queryKey: queryKeys.ssoConnectors,
    queryFn: () =>
      api.get("admin/sso/connectors").json<{ data: SsoConnector[] }>(),
  });
}

export function useCreateSsoConnector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSsoConnectorInput) =>
      api
        .post("admin/sso/connectors", { json: data })
        .json<{ data: SsoConnector }>(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.ssoConnectors });
      qc.invalidateQueries({ queryKey: queryKeys.ssoInfo });
    },
  });
}

export function useUpdateSsoConnector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      connectorId,
      ...data
    }: UpdateSsoConnectorInput & { connectorId: string }) =>
      api
        .patch(`admin/sso/connectors/${connectorId}`, { json: data })
        .json<{ data: SsoConnector }>(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.ssoConnectors });
      qc.invalidateQueries({ queryKey: queryKeys.ssoInfo });
    },
  });
}

export function useDeleteSsoConnector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (connectorId: string) =>
      api.delete(`admin/sso/connectors/${connectorId}`).then(() => {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.ssoConnectors });
      qc.invalidateQueries({ queryKey: queryKeys.ssoInfo });
    },
  });
}
