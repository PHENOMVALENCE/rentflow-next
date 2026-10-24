"use client";

import { usePathname } from "next/navigation";
import { AppIcon } from "@/components/icons";
import { useI18n } from "@/i18n/client";
import { setLocaleAction } from "@/i18n/actions";
import { LOCALES, type Locale } from "@/i18n/translate";

/** English / Kiswahili toggle (Laravel `x-rf.language-switcher`). Works as a plain form without JavaScript. */
export function LanguageSwitcher({ wide = false }: { wide?: boolean }) {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  return (
    <div className={`rf-lang-wrap${wide ? " rf-lang-wrap-wide" : ""}`}>
      <form
        action={setLocaleAction}
        className={`rf-lang${wide ? " rf-lang-wide" : ""}`}
        aria-label={t("Language")}
        onSubmit={(event) => {
          // Keep the query string (filters, report selection) when JavaScript is available.
          const field = event.currentTarget.elements.namedItem("return");
          if (field instanceof HTMLInputElement) field.value = `${window.location.pathname}${window.location.search}`;
        }}
      >
        <input type="hidden" name="return" value={pathname} />
        <span className="rf-lang-icon" aria-hidden="true"><AppIcon name="globe" className="h-4 w-4" /></span>
        {(Object.keys(LOCALES) as Locale[]).map((code) => (
          <button key={code} type="submit" name="locale" value={code} lang={code} aria-pressed={locale === code}>
            <span className="rf-lang-code" aria-hidden="true">{code.toUpperCase()}</span>
            <span className="rf-lang-name">{LOCALES[code]}</span>
          </button>
        ))}
      </form>
    </div>
  );
}
