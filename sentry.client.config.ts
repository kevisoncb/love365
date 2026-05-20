/**
 * Sentry (opcional) — instale: npm i @sentry/nextjs
 * Defina SENTRY_DSN e NEXT_PUBLIC_SENTRY_DSN na Vercel.
 * Descomente o bloco abaixo após instalar o pacote.
 */
/*
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
});

globalThis.__love365Sentry = Sentry;
*/

export {};
