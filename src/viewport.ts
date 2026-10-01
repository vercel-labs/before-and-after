import { ViewportConfig, ViewportSize, ViewportPreset, VIEWPORT_PRESETS } from './types.js';

export function resolveViewport(config?: ViewportConfig): ViewportSize {
  if (!config) {
    return VIEWPORT_PRESETS.desktop;
  }
  if (typeof config === 'string') {
    const preset = VIEWPORT_PRESETS[config as ViewportPreset];
    if (!preset) {
      throw new TypeError(`Unknown viewport preset: ${config}`);
    }
    return preset;
  }

  const dimensions = [config.width, config.height];
  if (!dimensions.every((value) => Number.isInteger(value) && value >= 1 && value <= 10_000)) {
    throw new TypeError('Viewport dimensions must be integers between 1 and 10000');
  }
  return config;
}
