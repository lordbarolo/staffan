import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

export const SESSION_COOKIE_NAME = "staffan_session";
const apiUrl = process.env.INTERNAL_API_URL ?? "http://127.0.0.1:3001";
const sessionSchema = z.object({
  operator: z.object({ id: z.string().min(1), username: z.string().min(1) }),
});

export type CurrentOperator = z.infer<typeof sessionSchema>["operator"];

export async function requireOperator(): Promise<CurrentOperator> {
  const cookieHeader = await sessionCookieHeader();
  if (cookieHeader === null) redirect("/login");
  try {
    const response = await fetch(`${apiUrl}/auth/session`, {
      cache: "no-store",
      headers: { cookie: cookieHeader },
    });
    if (!response.ok) redirect("/login");
    return sessionSchema.parse(await response.json()).operator;
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    redirect("/login?error=Sessionen+kunde+inte+verifieras");
  }
}

export async function authenticatedApiFetch(path: string, init?: RequestInit) {
  const cookieHeader = await sessionCookieHeader();
  if (cookieHeader === null) throw new AuthenticationRequiredError();
  const headers = new Headers(init?.headers);
  headers.set("cookie", cookieHeader);
  const response = await fetch(`${apiUrl}${path}`, { ...init, headers });
  if (response.status === 401) throw new AuthenticationRequiredError();
  return response;
}

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Inloggning krävs");
    this.name = "AuthenticationRequiredError";
  }
}

export function apiBaseUrl() {
  return apiUrl;
}

export function cookieIsSecure() {
  return process.env.AUTH_COOKIE_SECURE !== "false";
}

async function sessionCookieHeader() {
  const value = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  return value === undefined ? null : `${SESSION_COOKIE_NAME}=${value}`;
}

function isNextRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}
