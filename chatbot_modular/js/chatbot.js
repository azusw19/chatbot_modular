import { buildPayload, postJson } from "./net.js";
import { createStructure, appendMessage, showTyping, removeTyping, setOpen, updateStatus, trimDomMessages } from "./ui.js";
import { wireKeyboard, announce, createFocusTrap } from "./a11y.js";
import { simpleUUID } from "./utils.js";

export function mountChatbot(container, cfg) {
  const locale = cfg.locale || {};
  const a11y = locale.a11y || {};
  const roleNames = a11y.roleNames || {};
  const errorMessages = locale.errors || {};
  const defaultBotReply = locale.defaultBotReply || "...";
  const typingIndicatorText = locale.typingIndicatorText || defaultBotReply;
  const introMessage = locale.introMessage;
  const openLabel = a11y.openLabel || locale.launcherLabel || "Open chat";
  const assetBasePath = (cfg.assetBasePath || "./assets").replace(/\/$/, "");

  const view = createStructure(cfg);
  container.appendChild(view.root);
  const hostDoc = container.ownerDocument || document;
  hostDoc.body.appendChild(view.backdrop);
  const messageOptions = {
    showTimestamps: cfg.showTimestamps !== false,
    timestampFormat: cfg.timestampFormat,
    groupMessages: cfg.groupMessages !== false,
    groupGapMs: cfg.messageGroupGapMs ?? 120000,
  };

  const state = {
    conversationId: crypto?.randomUUID?.() ?? simpleUUID(),
    history: [],
    open: false,
    aborter: null,
    destroyed: false,
    typingTimer: null,
  };
  const launcherCloseLabel = locale.launcherCloseLabel || a11y.closeLabel || "Close chat";
  let launcherSwapTimer = null;
  function syncBackdrop(open) {
    view.backdrop.classList.toggle("cbt-backdrop-visible", open);
  }
  syncBackdrop(false);

  function syncLauncher(open) {
    const iconId = open ? "close" : "send";
    view.launcher.setAttribute("aria-expanded", open ? "true" : "false");
    view.launcher.setAttribute("aria-label", open ? launcherCloseLabel : openLabel);
    view.launcher.classList.toggle("cbt-launcher-compact", open);
    view.launcher.classList.toggle("cbt-launcher-open", open);

    if (launcherSwapTimer) {
      clearTimeout(launcherSwapTimer);
      launcherSwapTimer = null;
    }
    view.launcher.classList.add("cbt-launcher-swap");
    launcherSwapTimer = setTimeout(() => {
      const iconUrl = `${assetBasePath}/icons.svg#${iconId}`;
      view.launcherIcon.innerHTML = `<svg width="18" height="18" aria-hidden="true"><use href="${iconUrl}"></use></svg>`;
      view.launcher.classList.remove("cbt-launcher-swap");
      launcherSwapTimer = null;
    }, 120);
  }

  syncLauncher(false);
  const typingDelay = Number.isFinite(cfg.typingIndicatorDelay) ? cfg.typingIndicatorDelay : 220;
  let typingNode = null;
  function stopTypingIndicator() {
    if (state.typingTimer) {
      clearTimeout(state.typingTimer);
      state.typingTimer = null;
    }
    if (typingNode) {
      removeTyping(view.log, typingNode);
      typingNode = null;
    }
  }
  function startTypingIndicator() {
    stopTypingIndicator();
    state.typingTimer = setTimeout(() => {
      typingNode = showTyping(view.log, typingIndicatorText);
      state.typingTimer = null;
    }, typingDelay);
  }

  if (introMessage) {
    appendMessage(
      view.log,
      { role: "bot", text: introMessage, timestamp: Date.now() },
      messageOptions
    );
  }

  const focusRestore = { el: null };
  function open() {
    if (state.open) return;
    state.open = true;
    focusRestore.el = document.activeElement;
    setOpen(view.panel, true);
    syncLauncher(true);
    syncBackdrop(true);
    view.textarea.focus();
    updateStatus(view.status, a11y.statusIdle || "");
  }
  function close() {
    if (!state.open) return;
    state.open = false;
    setOpen(view.panel, false);
    syncLauncher(false);
    syncBackdrop(false);
    stopTypingIndicator();
    updateStatus(view.status, a11y.statusIdle || "");
    if (focusRestore.el && focusRestore.el.focus) focusRestore.el.focus();
    if (state.aborter) { state.aborter.abort(); state.aborter = null; }
  }

  view.launcher.addEventListener("click", () => {
    state.open ? close() : open();
  });
  view.close.addEventListener("click", close);
  const onBackdropClick = (event) => {
    event.preventDefault();
    close();
  };
  view.backdrop.addEventListener("click", onBackdropClick);

  const removeKb = wireKeyboard({
    panel: view.panel,
    textarea: view.textarea,
    send: view.send,
    onClose: close,
    onSubmit: sendMessage,
  });

  const removeTrap = createFocusTrap(view.panel);

  view.textarea.addEventListener("input", () => {
    view.textarea.style.height = "auto";
    view.textarea.style.height = Math.min(view.textarea.scrollHeight, 160) + "px";
  });

  view.send.addEventListener("click", () => sendMessage());

  function sendMessage() {
    const text = view.textarea.value.trim();
    if (!text || state.destroyed) return;
    view.textarea.value = "";
    view.textarea.style.height = "auto";
    const userEntry = { role: "user", text, timestamp: Date.now() };
    appendMessage(view.log, userEntry, messageOptions);
    state.history.push(userEntry);
    trimDomMessages(view.log, cfg.domMessageLimit);

    const payload = buildPayload(state, text, { sendHistory: cfg.sendHistory, historyLimit: cfg.historyLimit });

    updateStatus(view.status, a11y.statusTyping || "");
    announce(view.status, a11y.announceMessageFrom || "{role}", "user", roleNames);

    startTypingIndicator();

    if (state.aborter) state.aborter.abort();
    state.aborter = new AbortController();

    postJson(cfg.webhookUrl, payload, cfg.requestTimeoutMs, (input, init) => {
      return fetch(input, { ...init, signal: state.aborter.signal });
    }).then(result => {
      stopTypingIndicator();
      if (!result.ok) {
        updateStatus(view.status, a11y.statusError || "");
        const errorKind = result.error?.kind || "unknown";
        const mapped = errorMessages[errorKind] || "";
        const fallback = errorMessages.unknown || result.error?.message || defaultBotReply;
        const msg = mapped || result.error?.message || fallback;
        const errEntry = { role: "bot", text: msg, timestamp: Date.now() };
        appendMessage(view.log, errEntry, messageOptions);
        state.history.push(errEntry);
        trimDomMessages(view.log, cfg.domMessageLimit);
        return;
      }
      const botText = String(result.data?.text ?? "").trim() || defaultBotReply;
      const botEntry = { role: "bot", text: botText, timestamp: Date.now() };
      appendMessage(view.log, botEntry, messageOptions);
      state.history.push(botEntry);
      updateStatus(view.status, a11y.statusIdle || "");
      announce(view.status, a11y.announceMessageFrom || "{role}", "bot", roleNames);
      trimDomMessages(view.log, cfg.domMessageLimit);
    }).finally(() => {
      state.aborter = null;
    });
  }

  function destroy() {
    if (state.destroyed) return;
    state.destroyed = true;
    close();
    view.root.remove();
    view.backdrop.removeEventListener("click", onBackdropClick);
    view.backdrop.remove();
    removeKb();
    removeTrap();
  }

  return { destroy, open, close };
}
