import type { FastifyRequest, FastifyReply } from "fastify";
import * as oidcService from "./oidc.service.js";
import { env } from "../../../config/env.js";

function sanitizeReturnUrl(raw: string | undefined): string {
  if (!raw) return "/";
  // Check both raw and decoded values
  for (const value of [raw, decodeURIComponent(raw)]) {
    if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("\0")) {
      return "/";
    }
  }
  return raw;
}

export async function oidcLoginHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const query = request.query as {
    connector_id?: string;
    return_url?: string;
  };

  try {
    const returnUrl = sanitizeReturnUrl(query.return_url);
    const authUrl = await oidcService.initiateOidcLogin(
      request.server.prisma,
      query.connector_id,
      returnUrl,
    );

    return reply.redirect(authUrl);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "SSO login failed";
    request.server.log.error(err, "OIDC login initiation failed");
    return reply.redirect(
      `${env.FRONTEND_URL}/login?sso_error=${encodeURIComponent(message)}`,
    );
  }
}

export async function oidcCallbackHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const query = request.query as {
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
  };

  if (query.error) {
    const msg = encodeURIComponent(
      query.error_description || query.error || "SSO login failed",
    );
    return reply.redirect(`${env.FRONTEND_URL}/login?sso_error=${msg}`);
  }

  if (!query.code || !query.state) {
    return reply.redirect(
      `${env.FRONTEND_URL}/login?sso_error=${encodeURIComponent("Missing code or state")}`,
    );
  }

  try {
    const result = await oidcService.handleOidcCallback(
      request.server.prisma,
      query.code,
      query.state,
    );

    // Set refresh token cookie
    reply.setCookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: env.COOKIE_SAMESITE,
      domain: env.COOKIE_DOMAIN || undefined,
      path: "/api/auth",
      maxAge: 7 * 24 * 60 * 60,
    });

    // Redirect to the OIDC complete page
    const safeReturnUrl = sanitizeReturnUrl(result.returnUrl ?? undefined);
    return reply.redirect(
      `${env.FRONTEND_URL}/auth/oidc/complete?return_url=${encodeURIComponent(safeReturnUrl)}`,
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "SSO login failed";
    request.server.log.error(err, "OIDC callback failed");
    return reply.redirect(
      `${env.FRONTEND_URL}/login?sso_error=${encodeURIComponent(message)}`,
    );
  }
}
