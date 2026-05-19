export function extractYouTubeId(input: string): string | null {
  const s = (input || "").trim();
  if (!s) return null;
  if (!s.includes("http") && /^[a-zA-Z0-9_-]{11}$/.test(s)) return s;

  try {
    const url = new URL(s);
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.replace("/", "").trim();
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    const v = url.searchParams.get("v");
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
    const parts = url.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p === "shorts" || p === "embed");
    if (idx >= 0 && parts[idx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[idx + 1])) {
      return parts[idx + 1];
    }
    return null;
  } catch {
    return null;
  }
}
