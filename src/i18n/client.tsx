"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createTranslator, type Locale, type Translate } from "./translate";

const I18nContext = createContext<{ locale: Locale; t: Translate }>({ locale: "en", t: (english) => english });

export function I18nProvider({ locale, catalog, children }: { locale: Locale; catalog: Record<string, string>; children: ReactNode }) {
  const value = useMemo(() => ({ locale, t: createTranslator(locale, catalog) }), [locale, catalog]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
