// Market Item Types
export interface SIHPriceInfo {
  price: number;
  marketName?: string;
  commission?: string;
  storeUrl?: string;
}

export interface MarketItem {
  name: string;
  game: string;
  url: string;
  imageUrl?: string;
  sihPrice: number;
  buyOrderPrice?: number;
  netPrice: number;
  profit?: number;
  profitMargin?: number;
  feeRate?: number;
  boughtFor?: number;
  personalProfit?: number;
  personalProfitPercent?: number;
  lastUpdated?: string;  // ISO date string
}

// Storage Types
export interface StorageSettings {
  resetInterval: number;
  profitThreshold: number;
  hideBelowThreshold: boolean;
  personalMode: boolean;
  analyticsMode: boolean;
}

// Event Types
export interface ModalItem extends MarketItem {
  boughtFor: number;
}

// Price Types
export interface ExternalPrices {
  sihPrice?: number;
  buffPrice?: number;
} 