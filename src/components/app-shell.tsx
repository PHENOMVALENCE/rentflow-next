"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AppIcon } from "@/components/icons";
import { BrandMark } from "@/components/pub/brand";
import { avatarTone, initialsOf, isNavItemActive, navigationFor, ROLE_LABELS, type NavGroup, type NavRole } from "@/lib/navigation";

type ShellProps = {
  children: ReactNode;
  role: NavRole;
  userName: string;
  workspaceName: string;
  demoMode: boolean;
  logout?: () => Promise<void>;
};

export function Avatar({ name, size = "md" }: { name: string; size?: "xs" | "sm" | "md" | "lg" | "xl" }) {
  return <span className={`rf-avatar rf-avatar-${size} rf-avatar-c${avatarTone(name)}`} aria-hidden="true">{initialsOf(name)}</span>;
}

function Nav({ groups, pathname, onNavigate }: { groups: NavGroup[]; pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col" aria-label="Primary">
      {groups.map((group, index) => (
        <div key={group.group ?? `group-${index}`} className="rf-nav-section">
          {group.group && <p className="rf-nav-group">{group.group}</p>}
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isNavItemActive(item, pathname);
              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  title={`${item.label} · ${item.hint}`}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`rf-nav-link${active ? " rf-nav-active" : ""}`}
                >
                  <span className="shrink-0" aria-hidden="true"><AppIcon name={item.icon} /></span>
                  <span className="rf-nav-copy min-w-0 flex-1 truncate text-left">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

/** Authenticated frame (Laravel `layouts/app.blade.php`): collapsible sidebar, top bar, account menu, mobile drawer. */
export function AppShell({ children, role, userName, workspaceName, demoMode, logout }: ShellProps) {
  const pathname = usePathname();
  const groups = navigationFor(role);
  const roleLabel = ROLE_LABELS[role];
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("rf-sidebar");
    } catch {
      // Storage can be unavailable (private mode); the sidebar simply stays open.
    }
    if (stored === "0") {
      const frame = requestAnimationFrame(() => setSidebarOpen(false));
      return () => cancelAnimationFrame(frame);
    }
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      setNavOpen(false);
    };
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = navOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [navOpen]);

  const toggleSidebar = () => {
    setSidebarOpen((open) => {
      try {
        localStorage.setItem("rf-sidebar", open ? "0" : "1");
      } catch {
        // Ignore unavailable storage.
      }
      return !open;
    });
  };

  return (
    <div className="rf-app">
      <a href="#app-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg">Skip to content</a>
      <div className="flex min-h-screen">
        <aside className={`rf-sidebar rf-shell-sidebar sticky top-0 z-20 hidden h-screen shrink-0 flex-col overflow-hidden lg:flex ${sidebarOpen ? "" : "rf-sidebar-collapsed"}`}>
          <div className="flex h-16 shrink-0 items-center gap-3 border-b border-[#e3e8ef] px-5">
            <BrandMark />
            <div className="rf-brand-copy min-w-0">
              <p className="text-[0.9375rem] font-bold leading-tight text-[#0b1b33]">RentFlow</p>
              <p className="truncate text-xs text-[#51607a]">Rental operations</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <Nav groups={groups} pathname={pathname} />
          </div>
          <div className="border-t border-[#e3e8ef] p-3">
            <button type="button" className="rf-nav-link justify-center" onClick={toggleSidebar} aria-expanded={sidebarOpen} aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}>
              <AppIcon name="menu" />
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="rf-topbar sticky top-0 z-30">
            <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
              <button type="button" className="rf-topbar-control lg:hidden" onClick={() => setNavOpen(true)} aria-label="Open menu">
                <AppIcon name="menu" />
              </button>
              <Link href="/app" className="flex min-w-0 items-center gap-2 lg:hidden">
                <BrandMark className="h-8 w-8" />
                <span className="hidden text-[0.9375rem] font-bold text-[#0b1b33] min-[440px]:inline">RentFlow</span>
              </Link>

              {role === "PLATFORM_ADMIN" ? (
                <form method="get" action="/app/platform/search" className="rf-search hidden flex-1 md:flex md:max-w-md">
                  <span className="text-neutral-500" aria-hidden="true"><AppIcon name="search" className="h-4 w-4" /></span>
                  <input type="search" name="q" placeholder="Organizations, users, payments..." aria-label="Search the platform" className="w-full min-w-0 border-0 bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-500" />
                </form>
              ) : (
                <p className="hidden min-w-0 items-center gap-2 text-sm text-[#51607a] md:flex">
                  <span className="text-primary-600" aria-hidden="true"><AppIcon name="building" className="h-4 w-4" /></span>
                  <span className="sr-only">Organization:</span>
                  <span className="truncate font-medium text-[#24324a]">{workspaceName}</span>
                </p>
              )}

              <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
                {demoMode && <span className="rf-status rf-status-warning hidden sm:inline-flex" title="DATABASE_URL is not configured">Demo data</span>}
                <Link href="/app/notices" className="rf-topbar-control" aria-label="Notices">
                  <AppIcon name="bell" />
                </Link>

                <div ref={menuRef} className="relative shrink-0">
                  <button type="button" className="rf-account-trigger" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-haspopup="menu" aria-label="Account menu">
                    <Avatar name={userName} size="sm" />
                    <span className="rf-account-trigger-copy">
                      <span className="rf-account-trigger-name">{userName}</span>
                      <span className="rf-account-trigger-role">{roleLabel}</span>
                    </span>
                    <span className={`rf-account-trigger-chevron${menuOpen ? " rotate-180" : ""}`} aria-hidden="true">
                      <AppIcon name="chevron" className="h-4 w-4" />
                    </span>
                  </button>
                  {menuOpen && (
                    <div className="rf-menu rf-account-menu" role="menu">
                      <div className="rf-account-menu-head">
                        <Avatar name={userName} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#0b1b33]">{userName}</p>
                          <p className="mt-0.5 truncate text-xs font-medium text-[#51607a]">{roleLabel}</p>
                          <p className="mt-0.5 truncate text-xs text-[#51607a]">{workspaceName}</p>
                        </div>
                      </div>
                      <div className="pt-1.5">
                        <Link href="/app/profile" className="rf-menu-item" role="menuitem" onClick={() => setMenuOpen(false)}>
                          <span className="text-[#51607a]" aria-hidden="true"><AppIcon name="user" className="h-4 w-4" /></span>
                          Profile
                        </Link>
                        <Link href="/app/account" className="rf-menu-item" role="menuitem" onClick={() => setMenuOpen(false)}>
                          <span className="text-[#51607a]" aria-hidden="true"><AppIcon name="lock" className="h-4 w-4" /></span>
                          Account &amp; security
                        </Link>
                        {logout && (
                          <form action={logout}>
                            <button type="submit" className="rf-menu-item" role="menuitem">
                              <span className="text-[#51607a]" aria-hidden="true"><AppIcon name="logout" className="h-4 w-4" /></span>
                              Sign out
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main id="app-content" tabIndex={-1} className="relative flex-1 overflow-x-hidden px-4 py-5 outline-none sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            <div className="rf-page relative mx-auto max-w-[1440px]">{children}</div>
          </main>

          <footer className="rf-footer px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <p className="text-xs text-[#51607a]">© {new Date().getFullYear()} RentFlow. One lease state. One payment trail.</p>
              <Link href="/" className="text-xs font-medium text-[#51607a] transition-colors hover:text-[#0b1b33]">Public listings</Link>
            </div>
          </footer>
        </div>
      </div>

      {navOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-[#0b1b33]/40" onClick={() => setNavOpen(false)} />
          <aside className="rf-shell-sidebar absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col">
            <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[#e3e8ef] px-4">
              <div className="flex min-w-0 items-center gap-3">
                <BrandMark />
                <div className="min-w-0">
                  <p className="text-[0.9375rem] font-bold leading-tight text-[#0b1b33]">RentFlow</p>
                  <p className="truncate text-xs text-[#51607a]">{workspaceName}</p>
                </div>
              </div>
              <button type="button" className="rf-topbar-control" onClick={() => setNavOpen(false)} aria-label="Close menu">
                <AppIcon name="close" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <Nav groups={groups} pathname={pathname} onNavigate={() => setNavOpen(false)} />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
