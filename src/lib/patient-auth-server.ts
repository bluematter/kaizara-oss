// Node-runtime portal auth helpers: bcrypt, next/headers cookies.
// Do NOT import from Edge runtime (middleware).

import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import {
  PORTAL_AUTH_CONSTANTS,
  verifyPortalSession,
  type PortalSessionPayload,
} from "./patient-auth";

const BCRYPT_COST = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function setPortalSessionCookie(token: string) {
  const store = await cookies();
  store.set(PORTAL_AUTH_CONSTANTS.SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PORTAL_AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearPortalSessionCookie() {
  const store = await cookies();
  store.delete(PORTAL_AUTH_CONSTANTS.SESSION_COOKIE);
}

export async function getPortalSession(): Promise<PortalSessionPayload | null> {
  const store = await cookies();
  const token = store.get(PORTAL_AUTH_CONSTANTS.SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyPortalSession(token);
}
