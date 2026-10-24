import Link from "next/link";
import type { ReactNode } from "react";
import { PubIcon, type PubIconName } from "@/components/icons";
import { getSession } from "@/server/auth/session";
import { Brand } from "./brand";
import { PublicNavbar } from "./navbar";

/** Public page frame (Laravel `layouts/public`): skip link, navbar, content, footer. */
export async function PublicLayout({ children }: { children: ReactNode }) {
  const signedIn = Boolean(await getSession());
  return (
    <div className="pub-body">
      <a href="#public-content" className="pub-skip-link">Skip to content</a>
      <PublicNavbar signedIn={signedIn} />
      <main id="public-content" tabIndex={-1}>{children}</main>
      <PublicFooter signedIn={signedIn} />
    </div>
  );
}

export function PublicFooter({ signedIn }: { signedIn: boolean }) {
  const year = new Date().getFullYear();
  return (
    <footer className="pub-footer">
      <div className="pub-container">
        <div className="pub-footer-grid">
          <div className="pub-footer-about">
            <Brand />
            <p>Homes, shops and offices open for enquiry across Tanzania, with leases and full-term payments managed in one place.</p>
          </div>
          <nav aria-labelledby="footer-explore">
            <h2 id="footer-explore" className="pub-footer-title">Explore</h2>
            <ul className="pub-footer-links">
              <li><a href="/#available-units">Browse spaces</a></li>
              <li><a href="/#how-it-works">How it works</a></li>
            </ul>
          </nav>
          <nav aria-labelledby="footer-landlords">
            <h2 id="footer-landlords" className="pub-footer-title">Property teams</h2>
            <ul className="pub-footer-links">
              <li><Link href="/register?role=ORGANIZATION_ADMIN">List your property</Link></li>
              <li><a href="/#for-landlords">Why RentFlow</a></li>
            </ul>
          </nav>
          <nav aria-labelledby="footer-account">
            <h2 id="footer-account" className="pub-footer-title">Account</h2>
            <ul className="pub-footer-links">
              {signedIn ? (
                <li><Link href="/app">Open RentFlow</Link></li>
              ) : (
                <>
                  <li><Link href="/login">Sign in</Link></li>
                  <li><Link href="/register">Create account</Link></li>
                </>
              )}
            </ul>
          </nav>
        </div>
        <div className="pub-footer-bottom">
          <p>© {year} RentFlow · Tanzania</p>
          <p>One lease state. One payment trail.</p>
        </div>
      </div>
    </footer>
  );
}

export function HowItWorks() {
  const steps: { icon: PubIconName; title: string; text: string }[] = [
    { icon: "search", title: "Find your space", text: "Browse homes, shops and offices that are open right now. Occupied and reserved units never appear." },
    { icon: "send", title: "Send an enquiry", text: "Contact the property team from the listing. An enquiry asks a question; it does not reserve the unit." },
    { icon: "key", title: "Secure your lease", text: "Agree a 3- or 6-month lease with the property team and pay the full term through RentFlow." },
  ];
  return (
    <section id="how-it-works" className="pub-section pub-section-surface" aria-labelledby="how-title">
      <div className="pub-container">
        <div className="pub-center">
          <p className="pub-eyebrow">How it works</p>
          <h2 id="how-title" className="pub-h2 mt-2">From search to signed lease</h2>
          <p className="pub-lead mt-3">Three clear steps, with one record of your lease and payment from start to finish.</p>
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

export function LandlordCta({ signedIn }: { signedIn: boolean }) {
  return (
    <section id="for-landlords" className="pub-section" aria-labelledby="landlord-title">
      <div className="pub-container">
        <div className="pub-cta">
          <div>
            <p className="pub-eyebrow pub-eyebrow-on-dark">For property owners</p>
            <h2 id="landlord-title" className="pub-h2 mt-2">Have a property to manage?</h2>
            <p>Bring your rentals onto RentFlow and manage listings, tenants, leases and full-term payments from one place.</p>
            <div className="pub-cta-actions">
              {signedIn ? (
                <Link href="/app" className="pub-btn pub-btn-light pub-btn-lg">Open RentFlow <PubIcon name="arrow-right" className="pub-btn-arrow" /></Link>
              ) : (
                <>
                  <Link href="/register?role=ORGANIZATION_ADMIN" className="pub-btn pub-btn-light pub-btn-lg">List your property <PubIcon name="arrow-right" className="pub-btn-arrow" /></Link>
                  <Link href="/login" className="pub-btn pub-btn-on-dark pub-btn-lg">Sign in</Link>
                </>
              )}
            </div>
          </div>
          <ul className="pub-cta-list">
            <li><PubIcon name="building" /> Publish vacant units; occupied ones hide automatically</li>
            <li><PubIcon name="users" /> Review enquiries and onboard tenants</li>
            <li><PubIcon name="file" /> Keep lease copies with each 3- or 6-month term</li>
            <li><PubIcon name="wallet" /> Reconcile exact full-term payments</li>
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

export function Skyline() {
  return (
    <svg viewBox="0 0 1200 160" preserveAspectRatio="xMidYMax slice" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" focusable="false">
      <path d="M0 160V118h60v-30h44v30h28V70h70v90" />
      <path d="M202 160V96h40V60h64v100" />
      <path d="M306 160V108h52V40h86v120" />
      <path d="M444 160V88h34V66h58v94" />
      <path d="M536 160V120h46V24h92v136" />
      <path d="M674 160V98h40V74h70v86" />
      <path d="M784 160V56h78v104" />
      <path d="M862 160V112h38V84h64v76" />
      <path d="M964 160V46h70v114" />
      <path d="M1034 160V102h56V76h52v84" />
      <path d="M1142 160V114h58v46" />
      <path d="M558 48h48M558 72h48M558 96h48M806 80h34M806 104h34M328 64h42M328 88h42M986 70h26M986 94h26" strokeDasharray="6 8" />
    </svg>
  );
}
