"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PubIcon } from "@/components/icons";
import { Brand } from "./brand";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/i18n/client";

/** Public site navigation (Laravel `x-pub.navbar`): anchors, auth actions and a mobile sheet. */
export function PublicNavbar({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [menu, setMenu] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const anchor = (id: string) => (pathname === "/" ? `#${id}` : `/#${id}`);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      nav.toggleAttribute("data-scrolled", window.scrollY > 8);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    const onResize = () => window.innerWidth >= 1024 && setMenu(false);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setMenu(false);
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const links = [
    { id: "available-units", label: t("Browse spaces") },
    { id: "how-it-works", label: t("How it works") },
    { id: "for-landlords", label: t("For landlords") },
  ];

  return (
    <header ref={navRef} className={`pub-nav${menu ? " is-menu-open" : ""}`} data-pub-nav>
      <div className="pub-container pub-nav-inner">
        <Brand />

        <nav className="pub-nav-links" aria-label={t("Main")}>
          {links.map((link) => (
            <a key={link.id} href={anchor(link.id)} className="pub-nav-link">{link.label}</a>
          ))}
        </nav>

        <div className="pub-nav-actions">
          <LanguageSwitcher />
          {signedIn ? (
            <Link href="/app" className="pub-btn pub-btn-primary">{t("Open RentFlow")}</Link>
          ) : (
            <>
              <Link href="/login" className="pub-btn pub-btn-ghost">{t("Sign in")}</Link>
              <Link href="/register" className="pub-btn pub-btn-primary">{t("Create account")}</Link>
            </>
          )}
          <button type="button" className="pub-nav-toggle" onClick={() => setMenu((open) => !open)} aria-expanded={menu} aria-controls="pub-mobile-menu">
            <span className="sr-only">{menu ? t("Close menu") : t("Open menu")}</span>
            <PubIcon name={menu ? "x" : "menu"} />
          </button>
        </div>
      </div>

      {menu && (
        <>
          <div className="pub-menu-backdrop" onClick={() => setMenu(false)} />
          <div id="pub-mobile-menu" className="pub-menu">
            <nav className="pub-container pub-menu-list" aria-label={t("Mobile")}>
              <div className="pub-menu-lang">
                <p className="pub-menu-lang-label">Language · <span lang="sw">Lugha</span></p>
                <LanguageSwitcher wide />
              </div>
              {links.map((link) => (
                <a key={link.id} href={anchor(link.id)} className="pub-menu-link" onClick={() => setMenu(false)}>
                  {link.label} <PubIcon name="chevron-right" size="sm" />
                </a>
              ))}
              <div className="pub-menu-actions">
                {signedIn ? (
                  <Link href="/app" className="pub-btn pub-btn-primary pub-btn-lg" onClick={() => setMenu(false)}>{t("Open RentFlow")}</Link>
                ) : (
                  <>
                    <Link href="/register" className="pub-btn pub-btn-primary pub-btn-lg" onClick={() => setMenu(false)}>{t("Create account")}</Link>
                    <Link href="/login" className="pub-btn pub-btn-secondary pub-btn-lg" onClick={() => setMenu(false)}>{t("Sign in")}</Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
