import Link from "next/link";

type PremiumButtonProps = {
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "ghost";
  className?: string;
  children: React.ReactNode;
};

export function PremiumButton({
  href,
  onClick,
  type = "button",
  disabled,
  loading,
  variant = "primary",
  className = "",
  children,
}: PremiumButtonProps) {
  const base =
    "love-btn inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary:
      "bg-[var(--accent)] text-white shadow-lg shadow-[var(--glow)] hover:bg-[var(--accent-hover)] hover:scale-[1.02] active:scale-[0.98]",
    ghost:
      "border border-[var(--border)] bg-transparent text-white hover:border-[var(--border-accent)] hover:bg-[var(--accent-soft)]",
  };
  const cls = `${base} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={cls}>
      {loading && <span className="love-spinner" aria-hidden />}
      {children}
    </button>
  );
}
