import Link from "next/link";
import type { ReactNode } from "react";
import { PubIcon, type PubIconName } from "@/components/icons";
import { Brand } from "./brand";

/** Guest frame for sign-in and onboarding flows (Laravel `layouts/guest`). */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="pub-body pub-auth">
      <a href="#auth-content" className="pub-skip-link">Skip to content</a>
      <header className="pub-container pub-auth-bar">
        <Brand />
        <Link href="/" className="pub-btn pub-btn-ghost pub-btn-sm"><PubIcon name="arrow-left" /> Back to spaces</Link>
      </header>
      <main id="auth-content" tabIndex={-1} className="pub-auth-main">{children}</main>
    </div>
  );
}

const alertIcons: Record<"info" | "success" | "error", PubIconName> = { info: "info", success: "check-circle", error: "alert" };

export function AuthAlert({ tone = "info", children }: { tone?: "info" | "success" | "error"; children: ReactNode }) {
  return (
    <div className={`pub-alert pub-alert-${tone}`} role={tone === "error" ? "alert" : "status"}>
      <PubIcon name={alertIcons[tone]} />
      <p>{children}</p>
    </div>
  );
}

export function AuthField({ id, label, hint, optional, children }: { id: string; label: string; hint?: string; optional?: boolean; children: ReactNode }) {
  return (
    <div className="pub-field">
      <label htmlFor={id} className="pub-label">{label}{optional && <> <span className="pub-optional">(optional)</span></>}</label>
      {children}
      {hint && <p id={`${id}-hint`} className="pub-hint">{hint}</p>}
    </div>
  );
}

/** Four-digit PIN or one-time-code input styled like the Laravel `pub-otp` fields. */
export function CodeInput({ id, name, kind = "pin", autoComplete }: { id: string; name: string; kind?: "pin" | "otp"; autoComplete?: string }) {
  return (
    <input
      id={id}
      name={name}
      type={kind === "pin" ? "password" : "text"}
      inputMode="numeric"
      pattern="[0-9]{4}"
      minLength={4}
      maxLength={4}
      required
      placeholder={kind === "pin" ? "••••" : "0000"}
      autoComplete={autoComplete ?? (kind === "otp" ? "one-time-code" : "current-password")}
      className="pub-input pub-otp"
    />
  );
}
