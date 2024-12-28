/**
 * Related files that might need changes when modifying this file:
 * - Any file that imports from config (this is the main export point)
 * - src/config/constants.ts (exports are re-exported here)
 * - src/config/metadata.ts (exports are re-exported here)
 */

export { STORAGE_KEYS, DEFAULT_SETTINGS, type StorageKeys, type Settings } from './constants';
export { metadata, type UserScriptMetadata, parseMetadata } from './metadata'; 