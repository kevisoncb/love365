import { connectToDatabase, OpsErrorLog } from "@/lib/db";
import { createLogger, type LogScope } from "@/lib/logger";

export type ErrorCaptureContext = {
  scope: LogScope;
  route?: string;
  token?: string | null;
  meta?: Record<string, unknown>;
};

function serializeError(err: unknown): {
  name: string;
  message: string;
  stack?: string;
} {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack?.slice(0, 4000),
    };
  }
  return {
    name: "Error",
    message:
      typeof err === "string" ? err : JSON.stringify(err),
  };
}

async function persistError(
  err: unknown,
  ctx: ErrorCaptureContext
): Promise<void> {
  try {
    await connectToDatabase();
    const s = serializeError(err);
    await OpsErrorLog.create({
      scope: ctx.scope,
      route: ctx.route,
      token: ctx.token ?? undefined,
      name: s.name,
      message: s.message.slice(0, 2000),
      stack: s.stack?.slice(0, 4000),
      meta: ctx.meta,
    });
  } catch {
    /* não quebra fluxo principal */
  }
}

type SentryLike = {
  captureException: (
    err: unknown,
    hint?: {
      tags?: Record<string, string>;
      extra?: Record<string, unknown>;
    }
  ) => void;
};

declare global {
  // eslint-disable-next-line no-var
  var __love365Sentry: SentryLike | undefined;
}

/** Hook opcional — preencha via @sentry/nextjs em instrumentation.ts */
function forwardToSentry(
  err: unknown,
  ctx: ErrorCaptureContext
): void {
  const dsn =
    process.env.SENTRY_DSN ||
    process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  try {
    globalThis.__love365Sentry?.captureException(err, {
      tags: { scope: ctx.scope },
      extra: {
        route: ctx.route,
        token: ctx.token
          ? `${String(ctx.token).slice(0, 2)}…`
          : undefined,
        ...ctx.meta,
      },
    });
  } catch {
    /* noop */
  }
}

/** Captura server-side com log estruturado + persistência + Sentry opcional */
export async function captureServerError(
  err: unknown,
  ctx: ErrorCaptureContext
): Promise<void> {
  const log = createLogger("ERROR");
  log.error("captured", {
    route: ctx.route,
    token: ctx.token,
    error: err,
    meta: ctx.meta,
  });

  await persistError(err, ctx);
  forwardToSentry(err, ctx);
}

/** Fire-and-forget (não bloqueia resposta HTTP) */
export function captureServerErrorAsync(
  err: unknown,
  ctx: ErrorCaptureContext
): void {
  void captureServerError(err, ctx);
}
