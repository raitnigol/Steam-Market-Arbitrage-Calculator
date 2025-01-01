import type { MarketItem } from '../../types';
import { formatPrice, formatProfit } from '../../utils/formatters';

const createPriceRow = (label: string, value: number | undefined, isProfit = false, isPercentage = false) => {
  const row = document.createElement('div');
  row.className = 'price-row';

  const labelEl = document.createElement('span');
  labelEl.className = 'price-label';
  labelEl.textContent = label;

  const valueEl = document.createElement('span');
  valueEl.className = 'price-value';
  
  if (value !== undefined) {
    if (isProfit) {
      if (isPercentage) {
        valueEl.textContent = `${value.toFixed(2)}%`;
      } else {
        valueEl.textContent = formatProfit(value);
      }
      valueEl.className += value >= 0 ? ' profit-positive' : ' profit-negative';
    } else if (isPercentage) {
      valueEl.textContent = `${value.toFixed(2)}%`;
    } else {
      valueEl.textContent = formatPrice(value);
    }
  } else {
    valueEl.textContent = 'N/A';
  }

  row.appendChild(labelEl);
  row.appendChild(valueEl);
  return row;
};

export const createItemCard = (item: MarketItem): HTMLElement => {
  const card = document.createElement('div');
  card.className = 'item-card';

  // Create header with image and basic info
  const header = document.createElement('a');
  header.className = 'item-header';
  header.href = item.url;
  header.target = '_blank';  // Open in new tab

  const img = document.createElement('img');
  img.className = 'item-image';
  img.src = item.imageUrl || '';
  img.alt = item.name;

  const info = document.createElement('div');
  info.className = 'item-info';

  const name = document.createElement('div');
  name.className = 'item-name';
  name.textContent = item.name;

  const game = document.createElement('div');
  game.className = 'item-game';
  game.textContent = item.game;

  info.appendChild(name);
  info.appendChild(game);
  header.appendChild(img);
  header.appendChild(info);

  // Create details section with all available data
  const details = document.createElement('div');
  details.className = 'item-details';

  // Always show these core fields in consistent order
  const rows = [
    { label: 'SIH Price', value: item.sihPrice },
    { label: 'Buy Order', value: item.buyOrderPrice },
    { label: 'Net Price', value: item.netPrice },
    { label: 'Profit', value: item.profit, isProfit: true },
    { label: 'ROI', value: item.profitMargin, isProfit: true, isPercentage: true },
    { label: 'Fee Rate', value: item.feeRate, isPercentage: true }
  ];

  rows.forEach(row => {
    details.appendChild(createPriceRow(row.label, row.value, row.isProfit, row.isPercentage));
  });

  card.appendChild(header);
  card.appendChild(details);
  return card;
}; 