import Link from "next/link";

type LogoProps = {
  href?: string;
  size?: "sm" | "md";
};

export function Logo({ href = "/", size = "md" }: LogoProps) {
  const iconSize = size === "sm" ? 26 : 32;
  const textClass = size === "sm" ? "text-xl" : "text-2xl";

  const inner = (
    <>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className="shrink-0 transition-transform group-hover:scale-110"
      >
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill="var(--accent)"
        />
      </svg>
      <span className={`${textClass} font-semibold tracking-tight text-white`}>
        Love<span className="text-[var(--accent)]">365</span>
      </span>
    </>
  );

  const wrapped = (
    <span className="inline-flex items-center gap-2.5 group">{inner}</span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {wrapped}
      </Link>
    );
  }
  return wrapped;
}
