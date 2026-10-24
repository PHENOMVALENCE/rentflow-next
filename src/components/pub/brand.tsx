import Link from "next/link";

/** RentFlow wordmark with the gradient house mark (Laravel `x-pub.brand`). */
export function Brand({ className }: { className?: string }) {
  return (
    <Link href="/" className={["pub-brand", className].filter(Boolean).join(" ")} aria-label="RentFlow home">
      <span className="pub-brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21V9l9-6 9 6v12" />
          <path d="M9 21v-7h6v7" />
        </svg>
      </span>
      <span className="pub-brand-name">RentFlow</span>
    </Link>
  );
}

/** Square brand mark used inside the authenticated shell (`rf-mark`). */
export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span className={`rf-mark ${className}`} aria-hidden="true">
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M3 21V8l9-5 9 5v13" />
        <path d="M9 21v-8h6v8" />
      </svg>
    </span>
  );
}
