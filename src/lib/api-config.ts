/** Configuração padrão para Route Handlers (Vercel serverless / Next 16) */

export const API_RUNTIME = "nodejs" as const;
export const API_DYNAMIC = "force-dynamic" as const;

export const NO_STORE_HEADERS = {
  "Cache-Control":
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
} as const;
