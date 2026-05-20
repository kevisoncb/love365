import { logError } from "@/lib/logger";

export type FetchSafeOptions = {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  signal?: AbortSignal;
  label?: string;
};

const DEFAULT_TIMEOUT_MS = 25_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * fetch com timeout (AbortController) e retries opcionais.
 */
export async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  options?: FetchSafeOptions
): Promise<Response> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = Math.max(0, options?.retries ?? 0);
  const retryDelayMs = options?.retryDelayMs ?? 600;
  const label = options?.label ?? url;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      timeoutMs
    );

    const signals: AbortSignal[] = [controller.signal];
    if (options?.signal) {
      signals.push(options.signal);
    }

    const combinedSignal =
      typeof AbortSignal !== "undefined" &&
      "any" in AbortSignal
        ? (
            AbortSignal as typeof AbortSignal & {
              any: (signals: AbortSignal[]) => AbortSignal;
            }
          ).any(signals)
        : controller.signal;

    try {
      const res = await fetch(url, {
        ...init,
        signal: combinedSignal,
      });
      clearTimeout(timeoutId);
      return res;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;
      const isLast = attempt >= retries;
      if (isLast) break;
      await sleep(retryDelayMs * (attempt + 1));
    }
  }

  logError(`fetch failed: ${label}`, {
    route: label,
    error: lastError,
    meta: { timeoutMs, retries },
  });

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error(`Falha na requisição: ${label}`);
}
