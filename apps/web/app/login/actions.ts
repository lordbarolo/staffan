"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { apiBaseUrl, cookieIsSecure, SESSION_COOKIE_NAME } from "../auth";

const loginResponseSchema = z.object({ expiresAt: z.iso.datetime() });

export async function login(formData: FormData) {
  let destination = "/";
  try {
    const response = await fetch(`${apiBaseUrl()}/auth/login`, {
      body: JSON.stringify({
        password: formData.get("password"),
        username: formData.get("username"),
      }),
      cache: "no-store",
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    if (!response.ok) {
      destination = "/login?error=Felaktigt+användarnamn+eller+lösenord";
    } else {
      const payload = loginResponseSchema.parse(await response.json());
      const token = readSessionToken(response.headers.get("set-cookie"));
      if (token === null) throw new Error("API:t returnerade ingen session");
      (await cookies()).set(SESSION_COOKIE_NAME, token, {
        expires: new Date(payload.expiresAt),
        httpOnly: true,
        path: "/",
        sameSite: "strict",
        secure: cookieIsSecure(),
      });
    }
  } catch {
    destination = "/login?error=Inloggningen+kunde+inte+slutföras";
  }
  redirect(destination);
}

function readSessionToken(setCookie: string | null) {
  if (setCookie === null) return null;
  const match = new RegExp(`(?:^|[,;]\\s*)${SESSION_COOKIE_NAME}=([A-Za-z0-9_-]{43})`).exec(
    setCookie,
  );
  return match?.[1] ?? null;
}
