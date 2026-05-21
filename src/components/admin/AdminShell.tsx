"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { adminTheme } from "@/components/admin/admin-theme";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/tributes", label: "Homenagens" },
  { href: "/admin/logs", label: "Logs" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className={adminTheme.root}>
      <header className={adminTheme.header}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              Love365 Ops
            </p>
            <p className="font-display text-lg font-medium text-zinc-100">
              Central operacional
            </p>
          </div>
          <nav
            className="flex flex-wrap gap-1 rounded-xl border border-zinc-700/50 bg-zinc-800/40 p-1"
            aria-label="Navegação admin"
          >
            {NAV.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors sm:px-4 ${
                    active
                      ? "bg-zinc-700/90 text-zinc-50 shadow-sm"
                      : "text-zinc-400 hover:bg-zinc-700/40 hover:text-zinc-200"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
