/**
 * Related files that might need changes when modifying this file:
 * - src/config/index.ts (exports constants and types)
 * - src/services/storageService.ts (uses storage keys and settings)
 * - src/components/MainUI.ts (uses settings for UI behavior)
 * - src/services/eventHandlers.ts (uses settings for event handling)
 */

export interface StorageKeys {
  ITEMS: string;
  SETTINGS: string;
  LAST_RESET_TIME: string;
}

export interface Settings {
  resetInterval: number;
  profitThreshold: number;
  hideBelowThreshold: boolean;
  personalMode: boolean;
  analyticsMode: boolean;
}

export const STORAGE_KEYS: StorageKeys = {
  ITEMS: 'steam_market_items',
  SETTINGS: 'steam_market_settings',
  LAST_RESET_TIME: 'steam_market_last_reset'
};

export const DEFAULT_SETTINGS: Settings = {
  resetInterval: 6 * 3600000, // 6 hours in milliseconds
  profitThreshold: 10, // 10%
  hideBelowThreshold: false,
  personalMode: false,
  analyticsMode: true
}; 