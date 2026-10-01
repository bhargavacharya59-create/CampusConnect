import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_HOME, type Role } from "./constants";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession, type SessionPayload } from "./session";

/** Read the current session from the cookie (server components and actions only). */
export async function getSession(): Promise<SessionPayload | null> {
  return verifySession(cookies().get(SESSION_COOKIE)?.value);
}

/**
 * Use at the top of every protected page or layout.
 * Not logged in -> login page. Wrong role -> that user's own home.
 */
export async function requireRole(role: Role): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== role) redirect(ROLE_HOME[session.role]);
  return session;
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Cookies are "secure" (HTTPS only) in production unless COOKIE_SECURE=false, e.g. on a plain-HTTP campus server. */
function secureCookies(): boolean {
  if (process.env.COOKIE_SECURE === "false") return false;
  return process.env.NODE_ENV === "production";
}

export async function startSession(payload: SessionPayload) {
  const token = await signSession(payload);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies(),
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export function endSession() {
  cookies().delete(SESSION_COOKIE);
}
