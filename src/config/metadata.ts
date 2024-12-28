/**
 * Related files that might need changes when modifying this file:
 * - rollup.config.js (uses metadata for userscript header)
 * - src/config/index.ts (exports metadata types and functions)
 * - src/types/index.ts (might need updates if metadata structure changes)
 */

export interface UserScriptMetadata {
  name: string;
  namespace: string;
  version: string;
  description: string;
  author: string;
  match: string;
  icon: string;
  grants: string[];
}

export const metadata: string = `
// ==UserScript==
// @name         Steam Market Arbitrage Calculator
// @namespace    https://nigol.ee
// @version      2.0.0
// @description  Calculate potential profits from Steam Market arbitrage
// @author       Rait Nigol
// @match        https://steamcommunity.com/market/listings/*
// @icon         https://store.steampowered.com/favicon.ico
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// ==/UserScript==
`;

export const parseMetadata = (): UserScriptMetadata => {
  const lines = metadata.split('\n');
  const result: Partial<UserScriptMetadata> = {
    grants: []
  };

  lines.forEach(line => {
    const match = line.match(/\/\/ @(\w+)\s+(.+)/);
    if (match) {
      const [, key, value] = match;
      if (key === 'grant') {
        result.grants?.push(value);
      } else {
        (result as any)[key] = value;
      }
    }
  });

  return result as UserScriptMetadata;
}; 