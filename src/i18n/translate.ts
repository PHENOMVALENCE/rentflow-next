/**
 * English-sentence keyed translation, mirroring Laravel `App\Support\Phrases`: the English text is the key,
 * and a missing translation falls back to English so untranslated text is never blank.
 */
export type Locale = "en" | "sw";
export const LOCALES: Record<Locale, string> = { en: "English", sw: "Kiswahili" };
export const LOCALE_COOKIE = "rf_locale";

export type Replace = Record<string, string | number>;
export type Translate = (english: string, replace?: Replace) => string;

export function normalizeLocale(value: unknown): Locale {
  return value === "sw" ? "sw" : "en";
}

/** Replaces `:name` placeholders, longest names first so `:count` never clobbers `:counter`. */
export function fill(text: string, replace: Replace = {}) {
  return Object.keys(replace)
    .sort((a, b) => b.length - a.length)
    .reduce((out, key) => out.split(`:${key}`).join(String(replace[key])), text);
}

export function createTranslator(locale: Locale, catalog: Record<string, string>): Translate {
  return (english, replace) => fill(locale === "en" ? english : (catalog[english] ?? english), replace);
}

/** Laravel `Phrases::count`: picks the singular or plural English sentence, then translates it. */
export function plural(t: Translate, count: number, one: string, many: string, replace: Replace = {}) {
  return t(count === 1 ? one : many, { count, ...replace });
}
