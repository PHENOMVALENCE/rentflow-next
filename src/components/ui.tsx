import Link from "next/link";
import type { ReactNode } from "react";
import { AppIcon, type AppIconName } from "@/components/icons";

/** Page heading (Laravel `x-rf.page-head`), with an optional eyebrow kept for migrated screens. */
export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <header className="rf-page-head md:flex-row md:items-end md:justify-between">
      <div className="rf-page-head-copy">
        {eyebrow && <p className="rf-eyebrow mb-2">{eyebrow}</p>}
        <h1 className="rf-page-title rf-name">{title}</h1>
        {description && <div className="rf-page-lede">{description}</div>}
      </div>
      {action && <div className="rf-page-actions md:w-auto">{action}</div>}
    </header>
  );
}

/** KPI tile (Laravel `x-rf.metric`). */
export function Metric({ label, value, unit, hint, icon, href, progress, progressTone = "primary" }: {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: ReactNode;
  icon?: AppIconName;
  href?: string;
  progress?: number;
  progressTone?: "primary" | "teal" | "warning" | "error";
}) {
  const body = (
    <>
      <div className="rf-metric-top">
        <p className="rf-metric-label">{label}</p>
        {icon && <span className="rf-metric-icon" aria-hidden="true"><AppIcon name={icon} className="h-[18px] w-[18px]" /></span>}
      </div>
      <p className="rf-metric-value"><span className="rf-metric-number">{value}</span>{unit && <> <small>{unit}</small></>}</p>
      {progress !== undefined && <Progress value={progress} tone={progressTone} label={label} className="mt-3" />}
      {hint && <p className="rf-metric-hint">{hint}</p>}
    </>
  );
  return href ? <Link href={href} className="rf-metric">{body}</Link> : <article className="rf-metric">{body}</article>;
}

/** Backwards-compatible alias used by older screens. */
export function Stat({ label, value, note, icon }: { label: string; value: string | number; note?: string; icon?: AppIconName }) {
  return <Metric label={label} value={value} hint={note} icon={icon} />;
}

export function Progress({ value, tone = "primary", label, className }: { value: number; tone?: "primary" | "teal" | "warning" | "error"; label: string; className?: string }) {
  const width = Math.max(0, Math.min(100, value));
  return (
    <span className={["rf-progress", `rf-progress-${tone}`, className].filter(Boolean).join(" ")} role="progressbar" aria-valuenow={Math.round(width)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <span className="rf-progress-fill" style={{ width: `${width}%` }} />
    </span>
  );
}

export type StatusTone = "success" | "warning" | "error" | "info" | "teal" | "neutral";

/** Maps lease, payment and workflow states to the baseline badge tones. Text always carries the meaning. */
export function statusTone(label: string): StatusTone {
  const s = label.toLowerCase();
  if (/(exception|grace|overdue|high|urgent|fail|reject|cancel|terminat|block|mismatch|expired)/.test(s)) return "error";
  if (/(pending|renewal|await|draft|review|new|open|in progress|scheduled|unpaid|partial)/.test(s)) return "warning";
  if (/(confirm|paid|resolved|complete|success|verified)/.test(s)) return "success";
  if (/(active|available|published|occupied|assigned)/.test(s)) return "teal";
  if (/(info|reserved|listed)/.test(s)) return "info";
  return "neutral";
}

/** Status badge (Laravel `x-rf.status`). */
export function Status({ children, tone, solid = false }: { children: ReactNode; tone?: StatusTone; solid?: boolean }) {
  const resolved = tone ?? statusTone(String(children));
  return (
    <span className={`rf-status rf-status-${resolved}${solid ? " rf-status-solid" : ""}`}>
      <span className="truncate">{children}</span>
    </span>
  );
}

/** Content panel with a heading row (Laravel `x-rf.panel`). */
export function Panel({ title, subtitle, href, linkLabel = "View all", action, flush = false, children, className }: {
  title: string;
  subtitle?: ReactNode;
  href?: string;
  linkLabel?: string;
  action?: ReactNode;
  flush?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const id = `panel-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section className={["rf-panel", className].filter(Boolean).join(" ")} aria-labelledby={id}>
      <header className="rf-panel-head">
        <div className="min-w-0">
          <h2 id={id} className="rf-panel-title">{title}</h2>
          {subtitle && <p className="rf-panel-sub">{subtitle}</p>}
        </div>
        {href && (
          <Link href={href} className="rf-panel-link">
            {linkLabel} <AppIcon name="chevron-right" className="h-4 w-4" />
          </Link>
        )}
        {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
      </header>
      <div className={flush ? "rf-panel-flush" : "rf-panel-body"}>{children}</div>
    </section>
  );
}

/** Empty state (Laravel `x-rf.empty`). */
export function Empty({ icon = "home", title, children, action }: { icon?: AppIconName; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rf-empty">
      <span className="rf-icon-tile" aria-hidden="true"><AppIcon name={icon} /></span>
      <h5 className="mt-4 text-neutral-900">{title}</h5>
      {children && <div className="mt-2 max-w-xl text-sm text-neutral-600">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
