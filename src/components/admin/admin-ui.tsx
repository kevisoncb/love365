"use client";

import type { ReactNode } from "react";

import { adminTheme } from "@/components/admin/admin-theme";

export function AdminPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className={adminTheme.pageTitle}>{title}</h1>
        {subtitle && (
          <p className={adminTheme.pageSubtitle}>{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function AdminBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warn" | "error" | "accent";
}) {
  const tones = {
    neutral:
      "border-zinc-600/50 bg-zinc-800/60 text-zinc-300",
    success:
      "border-emerald-500/35 bg-emerald-500/12 text-emerald-400",
    warn: "border-amber-500/35 bg-amber-500/12 text-amber-400",
    error: "border-rose-500/35 bg-rose-500/12 text-rose-400",
    accent:
      "border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)]",
  };
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function AdminButton({
  children,
  onClick,
  variant = "ghost",
  disabled,
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  const variants = {
    primary:
      "border-[var(--accent)]/40 bg-[var(--accent)] text-white shadow-sm hover:bg-[var(--accent-hover)] hover:border-[var(--accent-hover)]",
    ghost:
      "border-zinc-600/55 bg-zinc-800/70 text-zinc-200 hover:border-zinc-500/70 hover:bg-zinc-700/80 hover:text-zinc-50",
    danger:
      "border-rose-500/35 bg-rose-500/10 text-rose-300 hover:border-rose-500/50 hover:bg-rose-500/18",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function AdminInput({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-zinc-600/55 bg-zinc-800/80 px-3 py-2.5 text-sm text-zinc-100 shadow-inner shadow-black/10 placeholder:text-zinc-500 transition-colors focus:border-zinc-500 focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-600/40 ${className}`}
      {...props}
    />
  );
}

export function AdminSelect({
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-lg border border-zinc-600/55 bg-zinc-800/80 px-3 py-2.5 text-sm text-zinc-100 shadow-inner shadow-black/10 transition-colors focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600/40 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function AdminStatCard({
  label,
  value,
  hint,
  highlight = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <article
      className={
        highlight ? adminTheme.cardHighlight : adminTheme.card
      }
    >
      <p className={adminTheme.label}>{label}</p>
      <p className={adminTheme.value}>{value}</p>
      {hint && <p className={adminTheme.hint}>{hint}</p>}
    </article>
  );
}

export function AdminFilterBar({
  children,
  columns = 5,
}: {
  children: ReactNode;
  columns?: 3 | 5;
}) {
  const grid =
    columns === 3 ? adminTheme.filterBar3 : adminTheme.filterBar;
  return <section className={grid}>{children}</section>;
}

export function deliveryStatusTone(
  status: string | null | undefined
): "success" | "warn" | "error" | "neutral" {
  const s = (status || "").toLowerCase();
  if (s === "sent") return "success";
  if (s === "pending") return "warn";
  if (s === "failed") return "error";
  return "neutral";
}

export function statusTone(
  status: string
): "success" | "warn" | "error" | "neutral" {
  const s = status.toUpperCase();
  if (s === "PAID" || s === "APPROVED") return "success";
  if (s === "PENDING" || s === "WAITING") return "warn";
  if (
    s === "FAILED" ||
    s === "CANCELLED" ||
    s === "CANCELED" ||
    s === "EXPIRED" ||
    s === "REJECTED"
  ) {
    return "error";
  }
  return "neutral";
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export { adminTheme };
