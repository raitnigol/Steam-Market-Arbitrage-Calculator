import { log } from '../utils/logger';
import { extractPriceFromText } from '../utils/priceUtils';
import type { MarketItem } from '../types';

const waitForElement = async (selector: string, timeout = 10000): Promise<Element | null> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element) return element;
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return null;
};

const extractGameInfo = () => {
  const gameNameEl = document.getElementById('largeiteminfo_game_name');
  const gameNameFromDOM = gameNameEl?.textContent?.trim() || '';
  const game = gameNameFromDOM === 'CS2' ? 'Counter-Strike 2' : (gameNameFromDOM || 'Unknown Game');
  
  const match = location.pathname.match(/\/market\/listings\/(\d+)\/(.+)/);
  const appId = match ? match[1] : '0';

  return { game, appId };
};

interface SIHPriceInfo {
  price: number;
  marketName?: string;
  commission?: string;
  storeUrl?: string;
}

const findSIHPrice = async (): Promise<SIHPriceInfo | null> => {
  try {
    // Keep trying to find SIH price for up to 30 seconds
    const startTime = Date.now();
    const maxWaitTime = 30000; // 30 seconds

    while (Date.now() - startTime < maxWaitTime) {
      // Try the standard CS2 price format first
      const standardPriceElement = document.querySelector('.sihmarket_container .sih_market__price');
      if (standardPriceElement) {
        const priceText = standardPriceElement.textContent?.trim() || '';
        const price = extractPriceFromText(priceText);
        if (price > 0) {
          log.i(`Found standard SIH price: ${price}`);
          return { price };
        }
      }

      // Try the alternative market block format
      const marketBlock = document.querySelector('.market_block');
      if (marketBlock) {
        const priceElement = marketBlock.querySelector('.price');
        const priceText = priceElement?.textContent?.trim() || '';
        const price = extractPriceFromText(priceText);

        if (price > 0) {
          // Extract additional info
          const marketName = marketBlock.querySelector('.button_link')?.textContent?.trim();
          const commission = marketBlock.querySelector('.deposit_percentage')?.textContent?.trim();
          const storeUrl = marketBlock.querySelector('.button')?.getAttribute('href') || undefined;

          log.i(`Found market block SIH price: ${price} from ${marketName}`);
          return {
            price,
            marketName,
            commission,
            storeUrl
          };
        }
      }

      // Wait a bit before next try
      await new Promise(resolve => setTimeout(resolve, 500));
      log.i('Waiting for SIH price...');
    }

    log.w('Timed out waiting for SIH price after 30 seconds');
    return null;
  } catch (error) {
    log.w(`Failed to get SIH price: ${error}`);
    return null;
  }
};

const findBuyOrderPrice = async (): Promise<number | null> => {
  try {
    // Keep trying to find buy order price for up to 30 seconds
    const startTime = Date.now();
    const maxWaitTime = 30000; // 30 seconds

    while (Date.now() - startTime < maxWaitTime) {
      // Try to get the price
      const priceElement = document.querySelector('#market_commodity_buyrequests .market_commodity_orders_header_promote:nth-child(2)');
      if (priceElement) {
        const priceText = priceElement.textContent?.trim() || '';
        const price = extractPriceFromText(priceText);
        if (price > 0) {
          log.i(`Found highest buy order price: ${price}`);
          return price;
        }
      }

      // Wait a bit before next try
      await new Promise(resolve => setTimeout(resolve, 500));
      log.i('Waiting for buy order price...');
    }

    log.w('Timed out waiting for buy order price after 30 seconds');
    return null;
  } catch (error) {
    log.w(`Failed to get buy order price: ${error}`);
    return null;
  }
};

const cleanupName = (name: string): string => {
  // Extract just the item name from the URL
  const match = location.pathname.match(/\/market\/listings\/\d+\/(.+)/);
  if (match) {
    // URL decode the name and remove any remaining special characters
    return decodeURIComponent(match[1]).replace(/[\n\t>]/g, '').trim();
  }
  // Fallback to cleaning up the provided name
  return name.replace(/[\n\t>]/g, '').replace(/\s+/g, ' ').trim();
};

const calculateNetPrice = (buyerPays: number): number => {
  // Special cases based on observed patterns
  if (buyerPays >= 0.03 && buyerPays <= 0.19) {
    return Math.max(0.01, buyerPays - 0.02);
  }
  if (buyerPays >= 0.20 && buyerPays <= 0.22) {
    return buyerPays - 0.03;
  }
  if (buyerPays >= 0.23 && buyerPays <= 0.32) {
    return buyerPays - 0.03;
  }
  if (buyerPays === 0.33) {
    return 0.29;
  }
  if (buyerPays >= 0.34 && buyerPays <= 0.65) {
    return Math.floor((buyerPays - 0.06) * 100) / 100;
  }
  if (buyerPays >= 0.70 && buyerPays <= 0.77) {
    return Math.floor((buyerPays - 0.09) * 100) / 100;
  }
  if (buyerPays >= 0.78 && buyerPays <= 0.79) {
    return 0.69;
  }
  if (buyerPays === 0.80) {
    return 0.70;
  }
  if (buyerPays >= 0.81 && buyerPays <= 0.89) {
    return Math.floor((buyerPays - 0.10) * 100) / 100;
  }
  if (buyerPays >= 0.90 && buyerPays <= 0.91) {
    return 0.79;
  }
  if (buyerPays === 0.92) {
    return 0.80;
  }
  if (buyerPays >= 0.93 && buyerPays <= 0.99) {
    return Math.floor((buyerPays - 0.12) * 100) / 100;
  }
  if (buyerPays === 1.00) {
    return 0.88;
  }

  // For amounts > 1€, use standard 13% fee (rounded to cents)
  return Math.floor(buyerPays * 0.87 * 100) / 100;
};

export const analyzeSingleItem = async (): Promise<MarketItem | null> => {
  try {
    // Wait for and extract basic info
    const nameElement = await waitForElement('.market_listing_nav, .market_listing_item_name');
    if (!nameElement) {
      log.w('Failed to find name element');
      return null;
    }

    const name = cleanupName(nameElement.textContent?.trim() || '');
    const imageUrl = document.querySelector('.market_listing_largeimage img')?.getAttribute('src') || '';
    const { game, appId } = extractGameInfo();

    // Extract prices
    const [buyOrderPrice, sihInfo] = await Promise.all([
      findBuyOrderPrice(),
      findSIHPrice()
    ]);

    if (!name || !buyOrderPrice) {
      log.w('Failed to extract basic item information');
      return null;
    }

    if (!sihInfo) {
      log.w('Failed to get SIH price. Please ensure Steam Inventory Helper is installed and enabled.');
      return null;
    }

    // Calculate net price and profits
    const netPrice = calculateNetPrice(buyOrderPrice);
    const profit = netPrice - sihInfo.price; // Profit = What you get - What you pay
    const profitMargin = (profit / sihInfo.price) * 100; // ROI percentage
    const feeRate = ((buyOrderPrice - netPrice) / buyOrderPrice) * 100; // Actual fee rate as percentage

    const item = {
      name,
      url: location.href,
      appId,
      game,
      buyOrderPrice,
      sihPrice: sihInfo.price,
      sihInfo,
      netPrice,
      profit,
      profitMargin,
      feeRate,
      imageUrl
    };

    log.i(`Successfully analyzed item: ${JSON.stringify(item, null, 2)}`);
    return item;

  } catch (error) {
    log.e(`Failed to analyze item: ${error}`);
    return null;
  }
}; 