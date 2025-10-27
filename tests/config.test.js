import { describe, it, expect } from 'vitest';
import { loadConfig, defaultConfig } from '../chatbot_modular/js/config.js';

describe('loadConfig', () => {
  it('returns default config when no overrides provided', async () => {
    const config = await loadConfig(null, {});
    expect(config.locale.botName).toEqual(defaultConfig.locale.botName);
    expect(config.assetBasePath).toEqual(defaultConfig.assetBasePath);
  });

  it('merges top-level overrides', async () => {
    const overrides = { requestTimeoutMs: 5000, assetBasePath: '/static/assets' };
    const config = await loadConfig(null, overrides);
    expect(config.requestTimeoutMs).toBe(5000);
    expect(config.assetBasePath).toBe('/static/assets');
  });

  it('merges nested locale objects', async () => {
    const overrides = { locale: { botName: 'Nested Test Bot' } };
    const config = await loadConfig(null, overrides);
    expect(config.locale.botName).toBe('Nested Test Bot');
    expect(config.locale.introMessage).toEqual(defaultConfig.locale.introMessage);
  });
});
