import { log } from './utils/logger';
import { createMainUI, updateAnalysis } from './components/MainUI';
import { analyzeSingleItem } from './services/marketService';
import { initializeStorage, addOrUpdateItem, getAllItems } from './services/storageService';
import { setupEventHandlers } from './services/eventHandlers';

// Initialize the userscript
const init = async () => {
  try {
    log.i('Initializing Steam Market Arbitrage...');

    // Initialize storage
    await initializeStorage();

    // Create UI
    const container = await createMainUI();
    if (!container) {
      throw new Error('Failed to create UI');
    }
    document.body.appendChild(container);

    // Setup event handlers
    setupEventHandlers();

    // Initial analysis
    const item = await analyzeSingleItem();
    if (item) {
      await addOrUpdateItem(item);
      const allItems = await getAllItems();
      updateAnalysis(allItems, container);
      log.i(`Analyzed item: ${item.name}`);
    } else {
      log.w('No item found or failed to analyze item');
      // Still show existing items
      const allItems = await getAllItems();
      updateAnalysis(allItems, container);
    }

    log.i('Steam Market Arbitrage initialized successfully');
  } catch (error) {
    log.e(`Failed to initialize: ${error}`);
  }
};

// Run the script
init(); 