/** FastAPI の `{"detail": ...}` を人が読める日本語に近づける */
export function formatUserSaveApiError(err: unknown, fallbackJa: string): string {
  if (!(err instanceof Error)) return fallbackJa;
  const t = err.message.trim();
  try {
    const j = JSON.parse(t) as { detail?: unknown };
    const d = j.detail;
    if (typeof d === "string" && d.trim()) return d.trim();
    if (Array.isArray(d) && d.length > 0) {
      const first = d[0] as { msg?: string };
      if (typeof first?.msg === "string" && first.msg.trim()) return first.msg.trim();
    }
  } catch {
    /* plain text or non-JSON */
  }
  if (t && t.length > 0 && t.length < 500) return t;
  return fallbackJa;
}
