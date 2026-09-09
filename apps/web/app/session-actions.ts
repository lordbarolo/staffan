"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { apiBaseUrl, SESSION_COOKIE_NAME } from "./auth";

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token !== undefined) {
    await fetch(`${apiBaseUrl()}/auth/logout`, {
      cache: "no-store",
      headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
      method: "POST",
    }).catch(() => undefined);
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
