function toErrorKind(error, status) {
  if (error?.name === "AbortError") return "timeout";
  if (status >= 500) return "server";
  if (status >= 400) return "client";
  return "network";
}

export function buildPayload(state, text, { sendHistory, historyLimit }) {
  const payload = { text, conversationId: state.conversationId };
  if (sendHistory && state.history?.length) {
    payload.history = state.history.slice(-historyLimit).map(m => ({ role: m.role, text: m.text }));
  }
  return payload;
}

export async function postJson(url, payload, timeoutMs = 20000, fetchImpl = fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const status = res.status;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error("HTTP " + status), { status, data });
    return { ok: true, data };
  } catch (err) {
    const status = err?.status ?? 0;
    const kind = toErrorKind(err, status);
    const message = err?.data?.message || err?.message || "";
    return { ok: false, error: { kind, message, status }, raw: err };
  } finally {
    clearTimeout(timer);
  }
}
