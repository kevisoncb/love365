/**
 * fetch no browser com timeout — evita loading infinito em rede lenta.
 */
export async function clientFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = 20_000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    timeoutMs
  );

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
