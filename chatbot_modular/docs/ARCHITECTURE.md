# Architecture

**Flow**: User input → `chatbot.js` (state/orchestration) → `net.js` (POST) + `ui.js` (render) + `a11y.js` (announce) → DOM updates.

- `bootstrap.js`: Loads config (defaults + JSON + window overrides), mounts chatbot into a provided container.
- `config.js`: Defines defaults; merges config sources.
- `chatbot.js`: Holds state (conversationId, history, open/closed), wires events, manages lifecycle, trims DOM, orchestrates calls.
- `net.js`: `buildPayload()` from state + text; `postJson()` with timeout/abort and error normalization.
- `ui.js`: Pure DOM functions (create structure, append messages, typing indicator, smart scroll, status text).
- `a11y.js`: Focus trapping, keyboard shortcuts, screen reader announcements.

**Decisions**
- No framework: smallest surface, easiest embed.
- Safe rendering: all dynamic message text is set via `textContent`; only trusted HTML paths use `.innerHTML`.
- Abort previous request on new submit and on close.
