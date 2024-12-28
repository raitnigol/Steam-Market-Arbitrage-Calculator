export const formatPrice = (value: number, currency = '€'): string => {
  return `${currency}${value.toFixed(2)}`;
};

export const formatPercent = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

export const formatProfit = (value: number, currency = '€'): string => {
  const formatted = formatPrice(Math.abs(value), currency);
  return value < 0 ? `-${formatted}` : formatted;
}; 