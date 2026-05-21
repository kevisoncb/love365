/** Tokens Tailwind do painel admin (dark SaaS, confortável) */

export const adminTheme = {
  root: "admin-root min-h-screen text-zinc-100 antialiased",

  header:
    "sticky top-0 z-50 border-b border-zinc-700/60 bg-zinc-900/85 backdrop-blur-xl shadow-sm shadow-black/10",

  pageTitle: "font-display text-2xl font-medium tracking-tight text-zinc-50 sm:text-3xl",
  pageSubtitle: "mt-1 text-sm text-zinc-400",

  /** Superfície glass leve */
  surface:
    "rounded-xl border border-zinc-700/50 bg-zinc-900/40 shadow-sm shadow-black/15 backdrop-blur-sm",

  surfaceHover: "transition-colors hover:border-zinc-600/60 hover:bg-zinc-800/50",

  /** Card com profundidade */
  card:
    "rounded-xl border border-zinc-700/55 bg-gradient-to-b from-zinc-800/50 to-zinc-900/60 p-4 shadow-sm shadow-black/20",

  cardHighlight:
    "rounded-xl border border-zinc-600/60 bg-gradient-to-b from-zinc-800/70 to-zinc-900/80 p-4 shadow-md shadow-black/25 ring-1 ring-zinc-600/30",

  filterBar:
    "grid gap-3 rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5",

  filterBar3:
    "grid gap-3 rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4 shadow-sm sm:grid-cols-3",

  label: "text-[10px] font-semibold uppercase tracking-wider text-zinc-500",
  value: "mt-2 font-display text-2xl font-medium tracking-tight text-zinc-50 sm:text-3xl",
  hint: "mt-1 text-xs text-zinc-500",

  tableWrap:
    "overflow-x-auto rounded-xl border border-zinc-700/50 bg-zinc-900/30 shadow-sm",

  tableHead:
    "sticky top-0 z-10 border-b border-zinc-700/60 bg-zinc-900/95 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 backdrop-blur-md",

  tableRow:
    "border-b border-zinc-800/80 transition-colors even:bg-zinc-800/25 hover:bg-zinc-800/45",

  tableCell: "px-4 py-3.5 text-sm text-zinc-300",
  tableCellMuted: "px-4 py-3.5 text-xs text-zinc-500",
  tableCellMono: "px-4 py-3.5 font-mono text-xs text-zinc-400",

  modalOverlay: "fixed inset-0 z-[60] flex items-end justify-center bg-zinc-950/75 p-4 backdrop-blur-sm sm:items-center",
  modalPanel:
    "max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-700/60 bg-zinc-900 p-6 shadow-2xl shadow-black/40",

  toast:
    "rounded-lg border border-[var(--accent)]/25 bg-[var(--accent)]/10 px-4 py-2.5 text-sm text-zinc-100",

  empty: "py-12 text-center text-sm text-zinc-500",
  loading: "py-20 text-center text-sm text-zinc-500",

  pagination: "text-xs text-zinc-500",
} as const;
