import { log } from '../utils/logger';
import { extractPriceFromText } from '../utils/priceUtils';
import { waitForElement } from '../utils/domUtils';
import type { ExternalPrices } from '../types';

export const getSIHPrice = async (): Promise<number> => {
  try {
    // Try to find SIH price element with retries
    const sihElement = await waitForElement(
      '[data-tip="Suggested price by Steam Inventory Helper"]',
      { timeout: 10000, isSIH: true }
    );

    if (!sihElement) {
      throw new Error('SIH price element not found');
    }

    const priceText = sihElement.textContent || '';
    return extractPriceFromText(priceText);
  } catch (error) {
    log.w(`Failed to get SIH price: ${error}`);
    return 0;
  }
};

export const getBuffPrice = async (): Promise<number> => {
  try {
    // Try to find BUFF price element
    const buffElement = await waitForElement(
      '[data-tip="Price on BUFF"]',
      { timeout: 5000 }
    );

    if (!buffElement) {
      return 0;
    }

    const priceText = buffElement.textContent || '';
    return extractPriceFromText(priceText);
  } catch (error) {
    log.w(`Failed to get BUFF price: ${error}`);
    return 0;
  }
};

export const getExternalPrices = async (): Promise<ExternalPrices> => {
  try {
    const [sihPrice, buffPrice] = await Promise.all([
      getSIHPrice(),
      getBuffPrice()
    ]);

    return {
      sihPrice: sihPrice || undefined,
      buffPrice: buffPrice || undefined
    };
  } catch (error) {
    log.e(`Failed to get external prices: ${error}`);
    return {};
  }
}; 