import Link from "next/link";
import type { ReactNode } from "react";
import { PubIcon, type PubIconName } from "@/components/icons";
import { getTranslator } from "@/i18n/server";
import { getSession } from "@/server/auth/session";
import { Brand } from "./brand";
import { PublicNavbar } from "./navbar";

/** Public page frame (Laravel `layouts/public`): skip link, navbar, content, footer. */
export async function PublicLayout({ children }: { children: ReactNode }) {
  const [session, { t }] = await Promise.all([getSession(), getTranslator()]);
  const signedIn = Boolean(session);
  return (
    <div className="pub-body">
      <a href="#public-content" className="pub-skip-link">{t("Skip to content")}</a>
      <PublicNavbar signedIn={signedIn} />
      <main id="public-content" tabIndex={-1}>{children}</main>
      <PublicFooter signedIn={signedIn} />
    </div>
  );
}

export async function PublicFooter({ signedIn }: { signedIn: boolean }) {
  const { t } = await getTranslator();
  const year = new Date().getFullYear();
  return (
    <footer className="pub-footer">
      <div className="pub-container">
        <div className="pub-footer-grid">
          <div className="pub-footer-about">
            <Brand />
            <p>{t("Homes, shops and offices open for enquiry across Tanzania, with leases and full-term payments managed in one place.")}</p>
          </div>
          <nav aria-labelledby="footer-explore">
            <h2 id="footer-explore" className="pub-footer-title">{t("Explore")}</h2>
            <ul className="pub-footer-links">
              <li><Link href="/#available-units">{t("Browse spaces")}</Link></li>
              <li><Link href="/#how-it-works">{t("How it works")}</Link></li>
            </ul>
          </nav>
          <nav aria-labelledby="footer-landlords">
            <h2 id="footer-landlords" className="pub-footer-title">{t("Property teams")}</h2>
            <ul className="pub-footer-links">
              <li><Link href="/register?role=ORGANIZATION_ADMIN">{t("List your property")}</Link></li>
              <li><Link href="/#for-landlords">{t("Why RentFlow")}</Link></li>
            </ul>
          </nav>
          <nav aria-labelledby="footer-account">
            <h2 id="footer-account" className="pub-footer-title">{t("Account")}</h2>
            <ul className="pub-footer-links">
              {signedIn ? (
                <li><Link href="/app">{t("Open RentFlow")}</Link></li>
              ) : (
                <>
                  <li><Link href="/login">{t("Sign in")}</Link></li>
                  <li><Link href="/register">{t("Create account")}</Link></li>
                </>
              )}
            </ul>
          </nav>
        </div>
        <div className="pub-footer-bottom">
          <p>© {year} RentFlow · Tanzania</p>
          <p>{t("One lease state. One payment trail.")}</p>
        </div>
      </div>
    </footer>
  );
}

export async function HowItWorks() {
  const { t } = await getTranslator();
  const steps: { icon: PubIconName; title: string; text: string }[] = [
    { icon: "search", title: t("Find your space"), text: t("Browse homes, shops and offices that are open right now. Occupied and reserved units never appear.") },
    { icon: "send", title: t("Send an enquiry"), text: t("Contact the property team from the listing. An enquiry asks a question; it does not reserve the unit.") },
    { icon: "key", title: t("Secure your lease"), text: t("Agree a 3- or 6-month lease with the property team and pay the full term through RentFlow.") },
  ];
  return (
    <section id="how-it-works" className="pub-section pub-section-surface" aria-labelledby="how-title">
      <div className="pub-container">
        <div className="pub-center">
          <p className="pub-eyebrow">{t("How it works")}</p>
          <h2 id="how-title" className="pub-h2 mt-2">{t("From search to signed lease")}</h2>
          <p className="pub-lead mt-3">{t("Three clear steps, with one record of your lease and payment from start to finish.")}</p>
        </div>
        <ol className="pub-steps">
          {steps.map((step, index) => (
            <li key={step.title} className="pub-step">
              <div className="pub-step-top">
                <span className="pub-step-icon"><PubIcon name={step.icon} /></span>
                <span className="pub-step-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="pub-h4">{step.title}</h3>
              <p>{step.text}</p>
              <span className="pub-step-arrow" aria-hidden="true"><PubIcon name="arrow-right" size="sm" /></span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export async function LandlordCta({ signedIn }: { signedIn: boolean }) {
  const { t } = await getTranslator();
  return (
    <section id="for-landlords" className="pub-section" aria-labelledby="landlord-title">
      <div className="pub-container">
        <div className="pub-cta">
          <div>
            <p className="pub-eyebrow pub-eyebrow-on-dark">{t("For property owners")}</p>
            <h2 id="landlord-title" className="pub-h2 mt-2">{t("Have a property to manage?")}</h2>
            <p>{t("Bring your rentals onto RentFlow and manage listings, tenants, leases and full-term payments from one place.")}</p>
            <div className="pub-cta-actions">
              {signedIn ? (
                <Link href="/app" className="pub-btn pub-btn-light pub-btn-lg">{t("Open RentFlow")} <PubIcon name="arrow-right" className="pub-btn-arrow" /></Link>
              ) : (
                <>
                  <Link href="/register?role=ORGANIZATION_ADMIN" className="pub-btn pub-btn-light pub-btn-lg">{t("List your property")} <PubIcon name="arrow-right" className="pub-btn-arrow" /></Link>
                  <Link href="/login" className="pub-btn pub-btn-on-dark pub-btn-lg">{t("Sign in")}</Link>
                </>
              )}
            </div>
          </div>
          <ul className="pub-cta-list">
            <li><PubIcon name="building" /> {t("Publish vacant units; occupied ones hide automatically")}</li>
            <li><PubIcon name="users" /> {t("Review enquiries and onboard tenants")}</li>
            <li><PubIcon name="file" /> {t("Keep lease copies with each 3- or 6-month term")}</li>
            <li><PubIcon name="wallet" /> {t("Reconcile exact full-term payments")}</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export function PubState({ title, icon = "search", tone = "empty", children, actions }: { title: string; icon?: PubIconName; tone?: "empty" | "error"; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className={`pub-state${tone === "error" ? " pub-state-error" : ""}`} role={tone === "error" ? "alert" : undefined}>
      <span className="pub-state-icon"><PubIcon name={icon} /></span>
      <h3 className="pub-h3">{title}</h3>
      {children}
      {actions && <div className="pub-state-actions">{actions}</div>}
    </div>
  );
}

export { Skyline } from "./skyline";
