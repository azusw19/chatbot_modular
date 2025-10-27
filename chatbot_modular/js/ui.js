// Pure UI helpers: create DOM, update views, sanitize, scroll

export function escapeHtml(str) {
  return str.replace(/[&<>"']/g, s => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[s]));
}

export function el(tag, className, attrs = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  for (const [k,v] of Object.entries(attrs)) {
    if (k === "text") node.textContent = v;
    else if (k === "html") node.innerHTML = v; // only use with trusted markup
    else node.setAttribute(k, v);
  }
  return node;
}

const timestampFormatters = new Map();
function normalizeTimestamp(value) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}
function formatTimestamp(ms, format = "24h") {
  const key = format === "12h" ? "12h" : "24h";
  if (!timestampFormatters.has(key)) {
    const options = key === "12h"
      ? { hour: "numeric", minute: "2-digit", hour12: true }
      : { hour: "2-digit", minute: "2-digit", hour12: false };
    timestampFormatters.set(key, new Intl.DateTimeFormat(undefined, options));
  }
  return timestampFormatters.get(key).format(new Date(ms));
}

export function createStructure(cfg) {
  const locale = cfg.locale || {};
  const a11y = locale.a11y || {};
  const root = document.createElement("div");
  root.className = "cbt-root";
  const backdrop = el("div", "cbt-backdrop", { "aria-hidden": "true" });
  const panelId = `cbt-panel-${Math.random().toString(36).slice(2,9)}`;
  const statusId = `${panelId}-status`;
  const basePath = (cfg.assetBasePath || "./assets").replace(/\/$/, "");
  // Launcher
  const launcher = el("button", "cbt-launcher", {
    "aria-label": a11y.openLabel || "Open chat",
    type: "button",
    "aria-haspopup": "dialog",
    "aria-expanded": "false",
    "aria-controls": panelId
  });
  const launcherImg = el("img", "cbt-launcher-img", { src: `${basePath}/launcher-placeholder.png`, alt: "", "aria-hidden": "true" });
  const launcherIcon = el("span", "cbt-launcher-icon");
  launcherIcon.innerHTML = `<svg width="18" height="18" aria-hidden="true"><use href="${basePath}/icons.svg#send"></use></svg>`;
  launcher.append(launcherImg, launcherIcon);

  // Panel
  const panel = el("section", "cbt-panel", {
    id: panelId,
    role: "dialog",
    "aria-modal": "true",
    "aria-label": locale.botName || "Chatbot",
    "aria-describedby": statusId
  });
  const header = el("header", "cbt-header");
  const heading = el("div", "cbt-heading");
  const title = el("div", "cbt-title", { text: locale.botName || "Chatbot" });
  const status = el("div", "cbt-status cbt-badge", { id: statusId, text: a11y.statusIdle || "", "aria-live":"polite" });
  const close = el("button", "cbt-close", { "aria-label": a11y.closeLabel || "Close chat", type:"button" });
  close.innerHTML = `<svg width="18" height="18" aria-hidden="true"><use href="${basePath}/icons.svg#close"></use></svg>`;
  heading.append(title, status);
  header.append(heading, close);

  const log = el("div", "cbt-log", { role: "log", "aria-live":"polite", "aria-relevant":"additions" });

  const inputWrap = el("div", "cbt-input");
  const textarea = el("textarea", "cbt-textarea", {
    "aria-label": a11y.inputLabel || "Message for chatbot",
    placeholder: locale.textareaPlaceholder || "",
    rows: "1"
  });
  const send = el("button", "cbt-send", { type: "button" });
  send.innerHTML = `<svg width="18" height="18" aria-hidden="true"><use href="${basePath}/icons.svg#send"></use></svg>`;
  inputWrap.append(textarea, send);

  panel.append(header, log, inputWrap);
  root.append(panel, launcher);

  return { root, backdrop, launcher, launcherImg, launcherIcon, panel, header, title, status, close, log, textarea, send };
}

export function appendMessage(log, message, opts = {}) {
  const { role, text } = message;
  const timestamp = normalizeTimestamp(message.timestamp);
  const prevRow = log.lastElementChild;
  const prevRole = prevRow?.dataset?.role;
  const prevTimestamp = Number(prevRow?.dataset?.timestamp) || 0;
  const groupGap = opts.groupGapMs ?? 120000;
  const allowGrouping = opts.groupMessages !== false;
  const shouldGroup = allowGrouping && prevRow && prevRole === role && timestamp - prevTimestamp < groupGap;
  const row = el("div", `cbt-row ${role}${shouldGroup ? " grouped" : ""}`);
  row.dataset.role = role;
  row.dataset.timestamp = String(timestamp);
  const wrapper = el("div", `cbt-message ${role}`);
  const bubble = el("div", `cbt-bubble ${role}`);
  bubble.textContent = text; // textContent is safe
  wrapper.append(bubble);
  const showTs = opts.showTimestamps !== false && (!allowGrouping || !shouldGroup);
  if (showTs) {
    const timeEl = el("time", "cbt-timestamp", {
      text: formatTimestamp(timestamp, opts.timestampFormat),
      datetime: new Date(timestamp).toISOString()
    });
    wrapper.append(timeEl);
  }
  row.append(wrapper);
  log.append(row);
  smartScrollToBottom(log);
}

export function showTyping(log, text = "...") {
  const row = el("div", "cbt-row bot", { "data-typing":"true" });
  const bubble = el("div", "cbt-bubble bot");
  bubble.innerHTML = `<span class="cbt-typing" aria-label="${escapeHtml(text)}">
    <span class="cbt-dot"></span><span class="cbt-dot"></span><span class="cbt-dot"></span>
  </span>`;
  row.append(bubble);
  log.append(row);
  smartScrollToBottom(log);
  return row;
}

export function removeTyping(log, typingNode) {
  if (typingNode && log.contains(typingNode)) typingNode.remove();
}

let rafId = 0;
export function smartScrollToBottom(scroller) {
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    scroller.scrollTop = scroller.scrollHeight;
  });
}

export function setOpen(panel, open) {
  panel.classList.toggle("cbt-open", open);
}

export function updateStatus(statusEl, text) {
  statusEl.textContent = text;
}

export function trimDomMessages(log, limit) {
  const rows = log.querySelectorAll(".cbt-row");
  const extra = rows.length - limit;
  if (extra > 0) {
    for (let i = 0; i < extra; i++) rows[i].remove();
  }
}










