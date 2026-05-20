/**
 * Logs estruturados para Vercel / operação SaaS.
 * Prefixos: [CREATE_PAGE] [UPLOAD] [PAYMENT] [WEBHOOK] [SYNC] [TRIBUTE] [ERROR] [ADMIN] [ANALYTICS]
 */

export type LogScope =
  | "CREATE_PAGE"
  | "UPLOAD"
  | "PAYMENT"
  | "WEBHOOK"
  | "SYNC"
  | "TRIBUTE"
  | "ADMIN"
  | "ANALYTICS"
  | "ERROR";

export type LogLevel = "info" | "warn" | "error";

export type LogContext = {
  status?: string | number;
  token?: string | null;
  route?: string;
  durationMs?: number;
  plan?: string;
  step?: number;
  error?: unknown;
  meta?: Record<string, unknown>;
};

function maskToken(token?: string | null): string | undefined {
  if (!token || typeof token !== "string") return undefined;
  const t = token.trim();
  if (t.length <= 4) return "****";
  return `${t.slice(0, 2)}…${t.slice(-2)}`;
}

function serializeError(err: unknown): {
  name: string;
  message: string;
  stack?: string;
} {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack?.split("\n").slice(0, 8).join("\n"),
    };
  }
  if (typeof err === "string") {
    return { name: "Error", message: err };
  }
  try {
    return {
      name: "Error",
      message: JSON.stringify(err),
    };
  } catch {
    return { name: "Error", message: "unknown" };
  }
}

function basePayload(
  scope: LogScope,
  level: LogLevel,
  message: string,
  ctx?: LogContext
): Record<string, unknown> {
  const env =
    process.env.VERCEL_ENV ||
    process.env.NODE_ENV ||
    "development";

  const payload: Record<string, unknown> = {
    scope,
    level,
    message,
    env,
    at: new Date().toISOString(),
  };

  if (ctx?.status !== undefined) payload.status = ctx.status;
  if (ctx?.route) payload.route = ctx.route;
  if (ctx?.durationMs !== undefined) {
    payload.durationMs = ctx.durationMs;
  }
  if (ctx?.plan) payload.plan = ctx.plan;
  if (ctx?.step !== undefined) payload.step = ctx.step;

  const tokenMask = maskToken(ctx?.token);
  if (tokenMask) payload.token = tokenMask;

  if (ctx?.meta && Object.keys(ctx.meta).length > 0) {
    payload.meta = ctx.meta;
  }

  if (ctx?.error !== undefined) {
    payload.error = serializeError(ctx.error);
  }

  return payload;
}

function emit(
  scope: LogScope,
  level: LogLevel,
  message: string,
  ctx?: LogContext
): void {
  const line = `[${scope}] ${message}`;
  const payload = basePayload(scope, level, message, ctx);

  if (level === "error") {
    console.error(line, payload);
    return;
  }
  if (level === "warn") {
    console.warn(line, payload);
    return;
  }
  console.log(line, payload);
}

export function createLogger(scope: LogScope) {
  const startedAt = Date.now();

  return {
    scope,
    info(message: string, ctx?: Omit<LogContext, "error">) {
      emit(scope, "info", message, ctx);
    },
    warn(message: string, ctx?: LogContext) {
      emit(scope, "warn", message, ctx);
    },
    error(message: string, ctx?: LogContext) {
      emit(scope, "error", message, ctx);
    },
    /** Log com duração desde createLogger() */
    done(
      message: string,
      ctx?: Omit<LogContext, "durationMs">
    ) {
      emit(scope, "info", message, {
        ...ctx,
        durationMs: Date.now() - startedAt,
      });
    },
    elapsed(): number {
      return Date.now() - startedAt;
    },
  };
}

/** Atalho global de erro operacional */
export function logError(
  message: string,
  ctx?: LogContext
): void {
  emit("ERROR", "error", message, ctx);
}
