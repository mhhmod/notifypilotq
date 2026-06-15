import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv, isSupabaseConfigured } from "@/lib/config/env";
import type { UserRole } from "@/types/domain";

const SESSION_COOKIE = "np_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

export interface SessionUser {
  email: string;
  role: UserRole;
  displayName: string;
}

interface SessionPayload extends SessionUser {
  expiresAt: number;
}

function sign(value: string) {
  return createHmac("sha256", serverEnv.authSessionSecret).update(value).digest("base64url");
}

function encode(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token?: string): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (payload.expiresAt < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSessionCookie(user: SessionUser) {
  const cookieStore = await cookies();
  const token = encode({
    ...user,
    expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000
  });

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS,
    path: "/"
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const session = decode(cookieStore.get(SESSION_COOKIE)?.value);
  if (session) {
    return {
      email: session.email,
      role: session.role,
      displayName: session.displayName
    };
  }

  return null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function validateLogin(email: string, password: string): Promise<SessionUser | null> {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseClient(
      publicEnv.supabaseUrl!,
      publicEnv.supabasePublishableKey!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user?.email) {
      return {
        email: data.user.email,
        role: "admin",
        displayName: data.user.email.split("@")[0] ?? "Admin"
      };
    }
  }

  if (!serverEnv.adminPassword) return null;
  if (email.toLowerCase() !== serverEnv.adminEmail.toLowerCase()) return null;

  const left = Buffer.from(password);
  const right = Buffer.from(serverEnv.adminPassword);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;

  return {
    email: serverEnv.adminEmail,
    role: "admin",
    displayName: "Aurela Admin"
  };
}

export function hasSessionCookie(cookieValue?: string) {
  return Boolean(decode(cookieValue));
}

export { SESSION_COOKIE };
