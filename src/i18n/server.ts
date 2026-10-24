import { cookies } from "next/headers";
import catalog from "./sw.json";
import extra from "./sw.extra.json";
import { createTranslator, LOCALE_COOKIE, normalizeLocale, type Locale, type Translate } from "./translate";

/** Laravel catalog (`lang/sw*.php|json`) wins; `sw.extra.json` covers phrases introduced in RentFlow Next. */
const sw: Record<string, string> = { ...(extra as Record<string, string>), ...(catalog as Record<string, string>) };

export async function getLocale(): Promise<Locale> {
  return normalizeLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}

export async function getTranslator(): Promise<{ locale: Locale; t: Translate }> {
  const locale = await getLocale();
  return { locale, t: createTranslator(locale, sw) };
}

/** Subset of the catalog for client components, so the full 300 KB catalog never ships to the browser. */
export function clientCatalog(locale: Locale, phrases: readonly string[]): Record<string, string> {
  if (locale === "en") return {};
  return Object.fromEntries(phrases.filter((phrase) => sw[phrase]).map((phrase) => [phrase, sw[phrase]]));
}
