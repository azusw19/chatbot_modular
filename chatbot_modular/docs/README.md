# Chatbot (Modular, ES Modules)

A lightweight, dependency-free chatbot UI you can embed on any page. Uses ES modules, accessible by default, safe text rendering, and cache-friendly assets.

## Quick start
1. Set your webhook in `/config/chatbot.config.json` (`webhookUrl`).
2. Open `index.html` in a modern browser. (For local fetch of JSON, serve over http; many browsers block file:// JSON fetches.)
3. Optionally override config at runtime by setting `window.ChatbotConfig` before calling `bootstrap(...)`.

## Embed into an existing site
```html
<link rel="stylesheet" href="/chatbot/assets/chatbot.css" />
<link rel="stylesheet" href="/chatbot/assets/themes.css" />
<div id="chatbot-root" data-config="/chatbot/config/chatbot.config.json"></div>
<script type="module">
  import bootstrap from "/chatbot/js/bootstrap.js";
  bootstrap("#chatbot-root");
</script>
```

## Config keys
- `webhookUrl` (string, required)
- `assetBasePath` (string): Base URL for chatbot assets. Defaults to `./assets`. Set to your hosted path, e.g. `/chatbot/assets`.
- Locale-driven strings such as `botName`, `introMessage`, `typingIndicatorText`
- `requestTimeoutMs`, `launcherTheme`
- `sendHistory` (bool), `historyLimit` (int), `domMessageLimit` (int)
- `showTimestamps`, `timestampFormat` (`24h` or `12h`), `groupMessages`, `messageGroupGapMs`
- `locale.a11y.*` labels

## Testing
This project uses Vitest for automated testing.
1. Install dependencies: `npm install`
2. Run tests: `npm test`

## API
`bootstrap(selector|element) -> { open, close, destroy }`

