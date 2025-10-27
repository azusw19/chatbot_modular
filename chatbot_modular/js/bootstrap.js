import { mountChatbot } from "./chatbot.js";
import { loadConfig } from "./config.js";

export default async function bootstrap(selectorOrEl) {
  const el = typeof selectorOrEl === "string"
    ? document.querySelector(selectorOrEl)
    : selectorOrEl;

  if (!el) {
    throw new Error("Chatbot container not found");
  }

  const jsonUrl = el.dataset?.config || null;
  const cfg = await loadConfig(jsonUrl, window.ChatbotConfig || {});
  if (!cfg.webhookUrl) {
    // Soft warning; still mount for UI dev
    console.warn("[chatbot] webhookUrl missing; responses will error until configured.");
  }

  return mountChatbot(el, cfg);
}
