// Edge-safe portal auth helpers (JWT, password policy, generators).
// For cookie setters and bcrypt hashing/verification, use patient-auth-server.ts (node runtime).

import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "kaizara-portal-session";
const SESSION_MAX_AGE_SECONDS = 30 * 60;

const TEMP_PASSWORD_TTL_DAYS = 7;
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MINUTES = 15;
const MIN_PASSWORD_LENGTH = 12;

export type PortalSessionPayload = {
  patientId: string;
  clinicId: string;
  mustChangePassword: boolean;
};

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signPortalSession(payload: PortalSessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.patientId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .setIssuer("kaizara-portal")
    .setAudience("patient")
    .sign(getSecret());
}

export async function verifyPortalSession(token: string): Promise<PortalSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: "kaizara-portal",
      audience: "patient",
    });
    if (
      typeof payload.patientId === "string" &&
      typeof payload.clinicId === "string" &&
      typeof payload.mustChangePassword === "boolean"
    ) {
      return {
        patientId: payload.patientId,
        clinicId: payload.clinicId,
        mustChangePassword: payload.mustChangePassword,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function readPortalSessionCookieFromRequest(req: NextRequest): string | undefined {
  return req.cookies.get(SESSION_COOKIE)?.value;
}

export function generateTempPassword(): string {
  // 12 chars: upper/lower/digits. No ambiguous chars (0/O, 1/l/I).
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

export function tempPasswordExpiry(): Date {
  return new Date(Date.now() + TEMP_PASSWORD_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export function lockoutUntil(): Date {
  return new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
}

export type PasswordPolicyResult = { ok: true } | { ok: false; reason: string };

export function validatePasswordPolicy(password: string): PasswordPolicyResult {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, reason: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (!/[a-z]/.test(password)) return { ok: false, reason: "Password must include a lowercase letter." };
  if (!/[A-Z]/.test(password)) return { ok: false, reason: "Password must include an uppercase letter." };
  if (!/[0-9]/.test(password)) return { ok: false, reason: "Password must include a number." };
  return { ok: true };
}

export const PORTAL_AUTH_CONSTANTS = {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  MAX_FAILED_LOGINS,
  LOCKOUT_MINUTES,
  MIN_PASSWORD_LENGTH,
};
