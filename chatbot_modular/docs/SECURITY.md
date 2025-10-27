# Security

- Output sanitization: all dynamic message text is set via `textContent`.
- No secrets in source: webhook URL is provided via JSON/config, not hardcoded.
- Network errors normalized; no stack traces shown to users.
- Server suggestions:
  - Validate origin/CSRF as applicable.
  - Rate-limit by conversationId/IP.
  - Strip/escape HTML server-side too if you render user content anywhere.
