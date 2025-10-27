# Accessibility

- Roles: `role="dialog"` for panel, `role="log"` for messages, `aria-live="polite"` for status.
- Keyboard:
  - `Esc`: close panel and return focus to launcher
  - `Enter`: send (Shift+Enter for newline)
  - Tab trap within panel (textarea ↔ send)
- Screenreader announcements:
  - Status `polite` region updated when messages sent/received.
  - Configurable template: `"{role} kaže:"`.

Tested heuristically with keyboard-only navigation and VoiceOver/NVDA patterns.
