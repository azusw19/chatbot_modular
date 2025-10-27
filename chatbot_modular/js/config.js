export const defaultConfig = {
  webhookUrl: "",                 // REQUIRED: set in /config/chatbot.config.json
  assetBasePath: "./assets",
  requestTimeoutMs: 20000,
  launcherTheme: "default",
  sendHistory: true,
  historyLimit: 8,
  domMessageLimit: 150,          // keep last N messages in DOM
  showTimestamps: true,
  timestampFormat: "24h",
  groupMessages: true,
  messageGroupGapMs: 120000,
  storageNamespace: "chatbot",
  typingIndicatorDelay: 220,
  locale: {
    botName: "Dodai Bot",
    introMessage: "Bok! Kako mogu pomoci danas?",
    typingIndicatorText: "Razmisljam.",
    launcherLabel: "Chat",
    launcherCloseLabel: "Zatvori chat",
    textareaPlaceholder: "Napisi poruku.",
    defaultBotReply: "...",
    errors: {
      timeout: "Vrijeme zahtjeva je isteklo.",
      server: "Posluzitelj je trenutno zauzet. Pokusajte kasnije.",
      client: "Zahtjev nije valjan. Provjerite unos.",
      network: "Mrezna greska. Provjerite vezu.",
      unknown: "Dogodila se nepoznata greska.",
    },
    a11y: {
      inputLabel: "Poruka za chatbota",
      openLabel: "Otvori chat",
      closeLabel: "Zatvori chat",
      statusIdle: "Spremno",
      statusTyping: "Bot pise.",
      statusError: "Greska mreze",
      announceMessageFrom: "{role} kaze:",
      roleNames: {
        user: "Korisnik",
        bot: "Bot"
      }
    },
  },
};

export async function loadConfig(jsonUrl, overrides = {}) {
  let fileCfg = {};
  if (jsonUrl) {
    try {
      const res = await fetch(jsonUrl, { cache: "no-store" });
      fileCfg = await res.json();
    } catch {
      // ignore; fallback to defaults + overrides
    }
  }
  const merged = { ...defaultConfig, ...fileCfg, ...overrides };
  merged.locale = {
    ...defaultConfig.locale,
    ...(fileCfg.locale || {}),
    ...(overrides.locale || {}),
  };
  merged.locale.a11y = {
    ...defaultConfig.locale.a11y,
    ...(fileCfg.locale?.a11y || {}),
    ...(overrides.locale?.a11y || {}),
  };
  merged.locale.errors = {
    ...defaultConfig.locale.errors,
    ...(fileCfg.locale?.errors || {}),
    ...(overrides.locale?.errors || {}),
  };
  return merged;
}
