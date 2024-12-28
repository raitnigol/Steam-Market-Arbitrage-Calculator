import { log } from '@utils/logger';

interface WaitForElementOptions {
  timeout?: number;
  isSIH?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

export const waitForElement = async (
  selector: string,
  options: WaitForElementOptions = {}
): Promise<Element | null> => {
  const {
    timeout = 10000,
    isSIH = false,
    retryAttempts = 5,
    retryDelay = 1000
  } = options;

  // First attempt with regular polling
  for (let i = 0; i < timeout / 100; i++) {
    const el = document.querySelector(selector);
    if (el) return el;
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // If it's a SIH element, try additional retries
  if (isSIH) {
    log.w('SIH element not found initially, starting retry mechanism...');
    
    for (let i = 0; i < retryAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      const el = document.querySelector(selector);
      if (el) {
        log.i(`SIH element found after ${i + 1} retries`);
        return el;
      }
      log.d(`SIH retry attempt ${i + 1} failed`);
    }
    
    throw new Error('SIH not loaded or not installed');
  }

  return null;
}; 