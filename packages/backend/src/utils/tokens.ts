import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "../config/env.js";

interface AccessTokenPayload {
  sub: string;
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "15m" });
}

export function verifyAccessToken(
  token: string,
): AccessTokenPayload & { iat: number; exp: number } {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload & {
    iat: number;
    exp: number;
  };
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
