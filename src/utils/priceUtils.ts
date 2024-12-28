export const formatPrice = (price: string | number): number => {
  if (!price) return 0;

  // Handle string inputs with different formats
  if (typeof price === 'string') {
    // Remove currency symbols and spaces
    price = price.replace(/[^0-9.,]/g, '');
    // Replace comma with dot for decimal
    price = price.replace(',', '.');
  }

  const parsed = parseFloat(price.toString());
  return isNaN(parsed) ? 0 : parsed;
};

export const formatPriceWithCurrency = (price: number, currency = '€'): string => {
  if (!price || isNaN(price)) return '-';
  return `${currency}${price.toFixed(2)}`;
};

export const formatPercent = (value: number): string => {
  if (!value || isNaN(value)) return '-';
  return `${value.toFixed(1)}%`;
};

export const formatProfit = (value: number, currency = '€'): string => {
  if (!value || isNaN(value)) return '-';
  const formatted = formatPriceWithCurrency(Math.abs(value), currency);
  return value < 0 ? `-${formatted}` : formatted;
};

// Steam Market fee constants
const STEAM_FEE = 0.05; // 5% Steam fee
const GAME_FEE = 0.10;  // 10% game fee

export interface Fees {
  steamFee: number;
  gameFee: number;
  total: number;
}

export const calculateFees = (price: number): Fees => {
  if (!price) return { steamFee: 0, gameFee: 0, total: 0 };

  const steamFee = price * STEAM_FEE;
  const gameFee = price * GAME_FEE;

  return {
    steamFee,
    gameFee,
    total: steamFee + gameFee
  };
};

export const calculateNetPrice = (price: number): number => {
  if (!price) return 0;
  const fees = calculateFees(price);
  return price - fees.total;
};

export const calculateProfitMargin = (buyPrice: number, sellPrice: number): number => {
  if (!buyPrice || !sellPrice) return 0;
  const netSellPrice = calculateNetPrice(sellPrice);
  return ((netSellPrice - buyPrice) / buyPrice) * 100;
};

export const extractPriceFromText = (text: string): number => {
  if (!text) return 0;
  const match = text.match(/[0-9,.]+/);
  return match ? formatPrice(match[0]) : 0;
}; 