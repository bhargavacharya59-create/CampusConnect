import { SignJWT, jwtVerify } from "jose";
import type { Role } from "./constants";

export const SESSION_COOKIE = "cc_session";
export const SESSION_DAYS = 7;

export interface SessionPayload {
  userId: string;
  role: Role;
  name: string;
}

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET is missing or too short. Set it in your .env file (see .env.example).");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (!payload.sub || typeof payload.role !== "string" || typeof payload.name !== "string") return null;
    return { userId: payload.sub, role: payload.role as Role, name: payload.name };
  } catch {
    return null;
  }
}
