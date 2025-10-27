const DEFAULT_FOCUS_SELECTOR = 'button:not([disabled]), [href], input:not([type="hidden"]), textarea, select, [tabindex]:not([tabindex="-1"])';

/**
 * Creates a focus trap within the given container.
 * Returns a disposer that removes the event listener.
 */
export function createFocusTrap(container, { selector = DEFAULT_FOCUS_SELECTOR } = {}) {
  function getFocusable() {
    return Array.from(container.querySelectorAll(selector))
      .filter(el => !el.hasAttribute("data-trap-ignore") && el.offsetParent !== null);
  }

  function onKey(e) {
    if (e.key !== "Tab") return;
    const focusable = getFocusable();
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (e.shiftKey) {
      if (active === first) { last.focus(); e.preventDefault(); }
    } else {
      if (active === last) { first.focus(); e.preventDefault(); }
    }
  }

  container.addEventListener("keydown", onKey);
  return () => container.removeEventListener("keydown", onKey);
}

export function wireKeyboard({ panel, textarea, send, onClose, onSubmit }) {
  function onKey(e) {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }
  panel.addEventListener("keydown", onKey);
  return () => panel.removeEventListener("keydown", onKey);
}

export function announce(liveEl, template, role, roleNames = {}) {
  const roleLabel = role === "user"
    ? (roleNames.user || "User")
    : (roleNames.bot || "Bot");
  const base = template || "{role}";
  const msg = base.replace("{role}", roleLabel);
  liveEl.textContent = msg;
}
