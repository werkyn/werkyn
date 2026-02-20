import * as oauth from "oauth4webapi";
import { allowInsecureRequests } from "oauth4webapi";
import crypto from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { env } from "../../../config/env.js";
import { UnauthorizedError } from "../../../utils/errors.js";
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
} from "../../../utils/tokens.js";

const CLIENT_ID = "werkyn";
const REDIRECT_URI = () => `${env.FRONTEND_URL}/api/auth/oidc/callback`;

// Talk directly to Dex on the internal port for backend-to-backend calls
// (discovery, token exchange, JWKS). Only the authorization_endpoint uses
// the external URL since the browser navigates there.
const DEX_INTERNAL_BASE = () =>
  `http://127.0.0.1:${env.DEX_INTERNAL_PORT}/dex`;

let cachedAuthServer: oauth.AuthorizationServer | null = null;

async function getAuthServer(): Promise<oauth.AuthorizationServer> {
  if (cachedAuthServer) return cachedAuthServer;

  const internalBase = DEX_INTERNAL_BASE();
  const externalIssuer = `${env.FRONTEND_URL}/dex`;

  // Build the AuthorizationServer manually so backend-to-Dex calls
  // go directly to the internal port (no proxy round-trip).
  // The authorization_endpoint uses the external URL for browser redirects.
  cachedAuthServer = {
    issuer: externalIssuer,
    authorization_endpoint: `${externalIssuer}/auth`,
    token_endpoint: `${internalBase}/token`,
    userinfo_endpoint: `${internalBase}/userinfo`,
    jwks_uri: `${internalBase}/keys`,
  };

  return cachedAuthServer;
}

export function clearAuthServerCache(): void {
  cachedAuthServer = null;
}

const client: oauth.Client = { client_id: CLIENT_ID };

export async function initiateOidcLogin(
  prisma: PrismaClient,
  connectorId?: string,
  returnUrl?: string,
): Promise<string> {
  const as = await getAuthServer();
  if (!as.authorization_endpoint) {
    throw new Error("Dex authorization endpoint not found");
  }

  const codeVerifier = oauth.generateRandomCodeVerifier();
  const codeChallenge = await oauth.calculatePKCECodeChallenge(codeVerifier);
  const state = crypto.randomBytes(32).toString("hex");
  const nonce = crypto.randomBytes(16).toString("hex");

  await prisma.oidcState.create({
    data: {
      state,
      codeVerifier,
      nonce,
      returnUrl,
      connectorId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  });

  const authUrl = new URL(as.authorization_endpoint);
  authUrl.searchParams.set("client_id", CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI());
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("nonce", nonce);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  if (connectorId) {
    authUrl.searchParams.set("connector_id", connectorId);
  }

  return authUrl.toString();
}

interface OidcCallbackResult {
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    jobTitle: string | null;
    phone: string | null;
    timezone: string | null;
    emailVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
  returnUrl: string | null;
  workspaces: Array<{
    id: string;
    workspaceId: string;
    role: string;
    workspace: {
      id: string;
      name: string;
      slug: string;
      logoUrl: string | null;
    };
  }>;
}

export async function handleOidcCallback(
  prisma: PrismaClient,
  code: string,
  stateParam: string,
): Promise<OidcCallbackResult> {
  // Look up and validate state
  const oidcState = await prisma.oidcState.findUnique({
    where: { state: stateParam },
  });

  if (!oidcState) {
    throw new UnauthorizedError("Invalid OIDC state");
  }

  if (oidcState.expiresAt < new Date()) {
    await prisma.oidcState.delete({ where: { id: oidcState.id } });
    throw new UnauthorizedError("OIDC state expired");
  }

  // Delete used state
  await prisma.oidcState.delete({ where: { id: oidcState.id } });

  const as = await getAuthServer();
  const clientAuth = oauth.ClientSecretPost(env.JWT_SECRET);

  // Exchange code for tokens
  // Build callback URL params as the browser would have delivered them
  const callbackUrl = new URL(REDIRECT_URI());
  callbackUrl.searchParams.set("code", code);
  callbackUrl.searchParams.set("state", stateParam);
  callbackUrl.searchParams.set("iss", as.issuer);

  // validateAuthResponse will throw AuthorizationResponseError on error
  const callbackParams = oauth.validateAuthResponse(
    as,
    client,
    callbackUrl,
    stateParam,
  );

  const tokenResponse = await oauth.authorizationCodeGrantRequest(
    as,
    client,
    clientAuth,
    callbackParams,
    REDIRECT_URI(),
    oidcState.codeVerifier,
    { [allowInsecureRequests]: true },
  );

  // processAuthorizationCodeResponse will throw ResponseBodyError on error
  const tokenResult = await oauth.processAuthorizationCodeResponse(
    as,
    client,
    tokenResponse,
    { expectedNonce: oidcState.nonce, requireIdToken: true },
  );

  const claims = oauth.getValidatedIdTokenClaims(tokenResult);
  if (!claims) {
    throw new UnauthorizedError("No ID token claims");
  }

  const sub = claims.sub;
  const email = (claims.email as string | undefined)?.toLowerCase();
  const name = (claims.name as string | undefined) || email || "SSO User";

  if (!email) {
    throw new UnauthorizedError("OIDC provider did not return an email");
  }

  // Find or create user
  const user = await findOrCreateUser(prisma, sub, email, name, oidcState.connectorId);

  // Generate werkyn tokens
  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const refreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      token: hashToken(refreshToken),
      familyId: crypto.randomUUID(),
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const workspaces = await prisma.workspaceMember.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      workspaceId: true,
      role: true,
      workspace: {
        select: { id: true, name: true, slug: true, logoUrl: true },
      },
    },
  });

  return {
    user,
    accessToken,
    refreshToken,
    returnUrl: oidcState.returnUrl,
    workspaces,
  };
}

async function findOrCreateUser(
  prisma: PrismaClient,
  sub: string,
  email: string,
  displayName: string,
  connectorId: string | null,
) {
  // 1. Check existing AuthProvider by OIDC sub
  const existingProvider = await prisma.authProvider.findUnique({
    where: { provider_providerSub: { provider: "oidc", providerSub: sub } },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          jobTitle: true,
          phone: true,
          timezone: true,
          emailVerified: true,
        },
      },
    },
  });

  if (existingProvider) {
    return existingProvider.user;
  }

  // 2. Check if auto-link by email is enabled
  const ssoConfig = await prisma.ssoConfig.findUnique({
    where: { id: "singleton" },
  });

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      jobTitle: true,
      phone: true,
      timezone: true,
      emailVerified: true,
    },
  });

  if (existingUser && existingUser.emailVerified && ssoConfig?.autoLinkByEmail) {
    // Auto-link: create AuthProvider for existing user
    await prisma.authProvider.create({
      data: {
        userId: existingUser.id,
        provider: "oidc",
        providerSub: sub,
        connectorId,
        email,
      },
    });
    return existingUser;
  }

  if (existingUser && !existingUser.emailVerified) {
    // Existing unverified user — link and verify
    await prisma.$transaction([
      prisma.authProvider.create({
        data: {
          userId: existingUser.id,
          provider: "oidc",
          providerSub: sub,
          connectorId,
          email,
        },
      }),
      prisma.user.update({
        where: { id: existingUser.id },
        data: { emailVerified: true },
      }),
    ]);
    return { ...existingUser, emailVerified: true };
  }

  if (existingUser) {
    // User exists but auto-link disabled — still link since they authenticated via OIDC
    await prisma.authProvider.create({
      data: {
        userId: existingUser.id,
        provider: "oidc",
        providerSub: sub,
        connectorId,
        email,
      },
    });
    return existingUser;
  }

  // 3. Create new user
  const newUser = await prisma.user.create({
    data: {
      email,
      displayName,
      passwordHash: null,
      emailVerified: true,
      authProviders: {
        create: {
          provider: "oidc",
          providerSub: sub,
          connectorId,
          email,
        },
      },
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      jobTitle: true,
      phone: true,
      timezone: true,
      emailVerified: true,
    },
  });

  return newUser;
}
