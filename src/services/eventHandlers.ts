import { log } from '../utils/logger';
import { analyzeSingleItem } from './marketService';
import { addOrUpdateItem, getAllItems, getSettings } from './storageService';
import { updateAnalysis } from '../components/MainUI';

export const setupEventHandlers = () => {
  // Listen for settings updates
  document.addEventListener('settings:updated', async () => {
    try {
      const items = await getAllItems();
      const container = document.querySelector('.market-analysis-container');
      if (container) {
        updateAnalysis(items, container as HTMLElement);
      }
    } catch (error) {
      log.e(`Failed to handle settings update: ${error}`);
    }
  });

  // Listen for item analysis updates
  document.addEventListener('item:analyzed', async (event) => {
    try {
      const item = (event as CustomEvent).detail;
      if (item) {
        await addOrUpdateItem(item);
        const items = await getAllItems();
        const container = document.querySelector('.market-analysis-container');
        if (container) {
          updateAnalysis(items, container as HTMLElement);
        }
      }
    } catch (error) {
      log.e(`Failed to handle item analysis: ${error}`);
    }
  });

  // Start analysis when SIH loads
  const observer = new MutationObserver(async (mutations) => {
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node instanceof HTMLElement) {
          const sihElement = node.querySelector('.sih-market-action');
          if (sihElement) {
            observer.disconnect();
            try {
              const item = await analyzeSingleItem();
              if (item) {
                await addOrUpdateItem(item);
                const items = await getAllItems();
                const container = document.querySelector('.market-analysis-container');
                if (container) {
                  updateAnalysis(items, container as HTMLElement);
                }
              }
            } catch (error) {
              log.e(`Failed to analyze item: ${error}`);
            }
            break;
          }
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}; 