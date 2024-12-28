import type { MarketItem, StorageSettings } from '../types';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../config';
import { log } from '../utils/logger';

export const initializeStorage = async (): Promise<void> => {
  try {
    // Initialize settings if they don't exist
    const existingSettings = await GM.getValue(STORAGE_KEYS.SETTINGS, '');
    if (!existingSettings) {
      await GM.setValue(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }

    // Initialize items array if it doesn't exist
    const existingItems = await GM.getValue(STORAGE_KEYS.ITEMS, '');
    if (!existingItems) {
      await GM.setValue(STORAGE_KEYS.ITEMS, JSON.stringify([]));
    }
  } catch (error) {
    log.e(`Failed to initialize storage: ${error}`);
  }
};

export const getAllItems = async (): Promise<MarketItem[]> => {
  try {
    const itemsJson = await GM.getValue(STORAGE_KEYS.ITEMS, '');
    return itemsJson ? JSON.parse(itemsJson) : [];
  } catch (error) {
    log.e(`Failed to get items: ${error}`);
    return [];
  }
};

export const setItems = async (items: MarketItem[]): Promise<void> => {
  try {
    await GM.setValue(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  } catch (error) {
    log.e(`Failed to set items: ${error}`);
  }
};

export const addOrUpdateItem = async (item: MarketItem): Promise<void> => {
  try {
    const items = await getAllItems();
    const existingItemIndex = items.findIndex(i => i.url === item.url);

    if (existingItemIndex !== -1) {
      // Update existing item
      const existingItem = items[existingItemIndex];
      items[existingItemIndex] = {
        ...existingItem,
        ...item,
        lastUpdated: new Date().toISOString()
      };
    } else {
      // Add new item
      items.push({
        ...item,
        lastUpdated: new Date().toISOString()
      });
    }

    await setItems(items);
  } catch (error) {
    log.e(`Failed to add/update item: ${error}`);
  }
};

export const getSettings = async (): Promise<StorageSettings> => {
  try {
    const settingsJson = await GM.getValue(STORAGE_KEYS.SETTINGS, '');
    return settingsJson ? JSON.parse(settingsJson) : DEFAULT_SETTINGS;
  } catch (error) {
    log.e(`Failed to get settings: ${error}`);
    return DEFAULT_SETTINGS;
  }
};

export const updateSettings = async (settings: Partial<StorageSettings>): Promise<void> => {
  try {
    const currentSettings = await getSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    await GM.setValue(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
  } catch (error) {
    log.e(`Failed to update settings: ${error}`);
  }
};

export const clearStorage = async (): Promise<void> => {
  try {
    await GM.deleteValue(STORAGE_KEYS.ITEMS);
    await GM.deleteValue(STORAGE_KEYS.SETTINGS);
    await initializeStorage();
  } catch (error) {
    log.e(`Failed to clear storage: ${error}`);
  }
};

export const purgeOldItems = async (): Promise<void> => {
  try {
    const settings = await getSettings();
    
    if (!settings.personalMode) {
      await setItems([]);
    }
  } catch (error) {
    log.e(`Failed to purge old items: ${error}`);
  }
};