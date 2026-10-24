"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LOCALE_COOKIE, normalizeLocale } from "./translate";

/** Stores the language choice for a year and returns to the same page (relative paths only, no open redirect). */
export async function setLocaleAction(formData: FormData) {
  const locale = normalizeLocale(formData.get("locale"));
  const back = String(formData.get("return") ?? "/");
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", httpOnly: false });
  redirect(back.startsWith("/") && !back.startsWith("//") ? back : "/");
}
