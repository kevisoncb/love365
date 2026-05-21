import { fetchWithTimeout } from "@/lib/fetch-safe";

export async function postJson(
  url: string,
  body: unknown,
  headers: Record<string, string>,
  label: string
): Promise<{ ok: boolean; status: number; json: unknown }> {
  const res = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    },
    { label, timeoutMs: 25_000, retries: 1 }
  );

  const json: unknown = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}
