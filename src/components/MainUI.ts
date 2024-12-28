import { log } from '../utils/logger';
import type { MarketItem } from '../types';
import { formatPrice, formatProfit } from '../utils/formatters';
import { getSettings, updateSettings, getAllItems, setItems } from '../services/storageService';

const createStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    .market-analysis-container {
      position: fixed;
      top: 20px;
      left: 20px;
      width: 350px;
      background: #1b2838;
      border: 1px solid #2a475e;
      border-radius: 4px;
      padding: 15px;
      color: #c6d4df;
      font-family: Arial, sans-serif;
      z-index: 9999;
      max-height: 80vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
      font-size: 13px;
    }

    .market-analysis-header {
      background: #2a475e;
      padding: 10px;
      border-radius: 4px 4px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }

    .market-analysis-title {
      font-weight: bold;
      color: #fff;
    }

    .header-controls {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .header-button {
      background: none;
      border: none;
      color: #c6d4df;
      cursor: pointer;
      padding: 5px;
      font-size: 16px;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .header-button:hover {
      color: #fff;
      background: #3d6c8d;
    }

    .market-analysis-content {
      padding: 10px;
      overflow-y: auto;
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    .item-card {
      background: #2a475e;
      border-radius: 4px;
      margin-bottom: 10px;
      overflow: visible;
      display: flex;
      flex-direction: column;
    }

    .item-header {
      display: flex;
      gap: 10px;
      padding: 10px;
      text-decoration: none;
      color: inherit;
    }

    .item-header:hover {
      background: #3d6c8d;
    }

    .item-image {
      width: 64px;
      height: 64px;
      border-radius: 4px;
      object-fit: cover;
    }

    .item-info {
      flex: 1;
      min-width: 0;
    }

    .item-name {
      font-weight: bold;
      margin-bottom: 4px;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-game {
      color: #66c0f4;
      font-size: 12px;
    }

    .item-details {
      padding: 10px;
      border-top: 1px solid #1b2838;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: 20px;
      width: 100%;
    }

    .price-label {
      color: #8f98a0;
    }

    .price-value {
      font-weight: bold;
      margin-left: 20px;
      text-align: right;
      flex-shrink: 0;
    }

    .profit-positive {
      color: #6cc067;
    }

    .profit-negative {
      color: #ff7b7b;
    }

    .settings-panel {
      display: none;
      flex-direction: column;
      gap: 15px;
      padding: 10px;
      background: #1b2838;
    }

    .settings-panel.visible {
      display: flex;
    }

    .settings-group {
      background: #2a475e;
      padding: 12px;
      border-radius: 3px;
    }

    .settings-group label {
      display: block;
      margin-bottom: 8px;
    }

    .settings-group input[type="number"] {
      width: 70px;
      margin-left: 8px;
      padding: 3px;
      background: #1b2838;
      border: 1px solid #4b6b8f;
      color: #fff;
      border-radius: 2px;
    }

    .settings-group input[type="checkbox"] {
      margin-right: 8px;
    }

    /* Custom scrollbar styles */
    .market-analysis-container *::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    .market-analysis-container *::-webkit-scrollbar-track {
      background: #1b2838;
      border-radius: 4px;
    }

    .market-analysis-container *::-webkit-scrollbar-thumb {
      background: #4f94bc;
      border-radius: 4px;
    }

    .market-analysis-container *::-webkit-scrollbar-thumb:hover {
      background: #66c0f4;
    }

    .game-navigation {
      background: #2a475e;
      border-bottom: 1px solid #1b2838;
      display: flex;
      align-items: center;
      padding: 0 10px;
      flex-shrink: 0;
      min-height: 40px;
    }

    .game-tabs {
      display: flex;
      overflow-x: auto;
      scrollbar-width: thin;
      flex-grow: 1;
    }

    .game-tabs::-webkit-scrollbar {
      height: 4px;
    }

    .game-tabs::-webkit-scrollbar-track {
      background: #1b2838;
    }

    .game-tabs::-webkit-scrollbar-thumb {
      background: #4f94bc;
    }

    .game-tab {
      padding: 8px 16px;
      color: #c6d4df;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      white-space: nowrap;
      transition: all 0.2s;
    }

    .game-tab:hover {
      color: #fff;
      background: #3d6c8d;
    }

    .game-tab.active {
      color: #fff;
      border-bottom-color: #66c0f4;
    }

    .game-dropdown {
      position: relative;
      margin-left: 10px;
    }

    .game-dropdown select {
      background: #2a475e;
      color: #fff;
      border: 1px solid #4f94bc;
      padding: 4px 8px;
      border-radius: 3px;
      cursor: pointer;
    }

    .game-dropdown select:hover {
      background: #3d6c8d;
    }

    .market-analysis-container.market-analysis-minimized {
      height: auto;
    }

    .market-analysis-container.market-analysis-minimized .market-analysis-content,
    .market-analysis-container.market-analysis-minimized .game-navigation {
      display: none;
    }

    @keyframes highlight-update {
      0% { 
        background: #2a475e;
        transform: scale(1);
      }
      50% { 
        background: #3d8054;
        transform: scale(1.02);
      }
      100% { 
        background: #2a475e;
        transform: scale(1);
      }
    }

    .item-card.updated {
      animation: highlight-update 0.5s ease;
      z-index: 1;
    }

    .item-card.current {
      border: 2px solid #66c0f4;
    }

    .item-card.outdated {
      opacity: 0.7;
    }

    .hidden-items-message {
      margin-top: 10px;
      padding: 8px;
      background: #2a475e;
      border-radius: 3px;
      text-align: center;
      color: #acdbf5;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .settings-header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #2a475e;
    }

    .settings-header h3 {
      margin: 0 0 5px;
      color: #fff;
      font-size: 16px;
    }

    .author-links {
      font-size: 12px;
      color: #acdbf5;
    }

    .author-links a {
      color: #66c0f4;
      text-decoration: none;
      transition: color 0.2s;
    }

    .author-links a:hover {
      color: #fff;
    }

    .settings-button {
      width: 100%;
      margin-bottom: 10px;
      padding: 8px;
      background: #2a475e;
      color: #fff;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .settings-button:hover {
      background: #3d6c8d;
    }

    .settings-button:last-child {
      margin-bottom: 0;
    }

    .toggle-hidden-btn {
      background: #1b2838;
      color: #66c0f4;
      border: 1px solid #4f94bc;
      padding: 4px 8px;
      border-radius: 2px;
      cursor: pointer;
      font-size: 11px;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .toggle-hidden-btn:hover {
      background: #2a475e;
      color: #fff;
    }

    .hidden-items-container {
      margin-top: 10px;
      border-top: 1px solid #2a475e;
      padding-top: 10px;
    }

    .item-card.below-threshold {
      opacity: 0.7;
      border-left: 2px solid #ff7b7b;
    }
  `;
  return style;
};

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

const createItemCard = (item: MarketItem): HTMLElement => {
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

async function createSettingsPanel(container: HTMLElement): Promise<HTMLElement> {
  const panel = document.createElement('div');
  panel.className = 'settings-panel';

  // Header with info
  const header = document.createElement('div');
  header.className = 'settings-header';
  header.innerHTML = `
    <h3>Steam Market Arbitrage Calculator</h3>
    <div class="author-links">
      <a href="https://github.com/raitnigol/Steam-Market-Arbitrage-Calculator" target="_blank">GitHub Repository</a>
      •
      <a href="https://nigol.ee" target="_blank">nigol.ee</a>
    </div>
  `;
  panel.appendChild(header);

  // General Settings Group
  const generalGroup = document.createElement('div');
  generalGroup.className = 'settings-group';
  
  // Get current settings
  const settings = await getSettings();
  
  // Profit Threshold Setting
  const thresholdLabel = document.createElement('label');
  const thresholdInput = document.createElement('input');
  thresholdInput.type = 'number';
  thresholdInput.step = '0.1';
  thresholdInput.value = settings.profitThreshold.toString();
  thresholdLabel.textContent = 'Profit Threshold: ';
  const percentageSpan = document.createElement('span');
  percentageSpan.textContent = '%';
  thresholdLabel.appendChild(thresholdInput);
  thresholdLabel.appendChild(percentageSpan);
  
  // Hide Below Threshold Setting
  const hideLabel = document.createElement('label');
  const hideInput = document.createElement('input');
  hideInput.type = 'checkbox';
  hideInput.checked = settings.hideBelowThreshold;
  hideLabel.appendChild(hideInput);
  hideLabel.appendChild(document.createTextNode('Hide Items Below Threshold'));
  
  // Personal Mode Setting
  const personalLabel = document.createElement('label');
  const personalInput = document.createElement('input');
  personalInput.type = 'checkbox';
  personalInput.checked = settings.personalMode;
  personalLabel.appendChild(personalInput);
  personalLabel.appendChild(document.createTextNode('Personal Tracking Mode'));

  generalGroup.appendChild(thresholdLabel);
  generalGroup.appendChild(hideLabel);
  generalGroup.appendChild(personalLabel);
  
  panel.appendChild(generalGroup);

  // Data Management Group
  const dataGroup = document.createElement('div');
  dataGroup.className = 'settings-group';
  
  // Export Button
  const exportBtn = document.createElement('button');
  exportBtn.className = 'settings-button';
  exportBtn.textContent = 'Export Data';
  exportBtn.onclick = async () => {
    try {
      const items = await getAllItems();
      const currentSettings = await getSettings();
      const exportData = {
        items,
        settings: currentSettings,
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `steam-market-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      log.e(`Failed to export data: ${error}`);
    }
  };

  // Import Button and File Input
  const importInput = document.createElement('input');
  importInput.type = 'file';
  importInput.accept = '.json';
  importInput.style.display = 'none';
  
  const importBtn = document.createElement('button');
  importBtn.className = 'settings-button';
  importBtn.textContent = 'Import Data';
  importBtn.onclick = () => importInput.click();

  importInput.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (data.items && Array.isArray(data.items)) {
        await setItems(data.items);
      }
      
      if (data.settings) {
        await updateSettings(data.settings);
      }
      
      // Refresh UI
      const items = await getAllItems();
      updateAnalysis(items, container, true);
      
      // Reset file input
      importInput.value = '';
    } catch (error) {
      log.e(`Failed to import data: ${error}`);
    }
  };

  dataGroup.appendChild(exportBtn);
  dataGroup.appendChild(importBtn);
  dataGroup.appendChild(importInput);
  
  panel.appendChild(dataGroup);

  // Event Listeners
  thresholdInput.addEventListener('change', async () => {
    let value = thresholdInput.value.replace(',', '.');
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      await updateSettings({ profitThreshold: numValue });
      thresholdInput.value = numValue.toString();
      const items = (container as any).currentItems || [];
      updateAnalysis(items, container, true);
    }
  });

  hideInput.addEventListener('change', async () => {
    await updateSettings({ hideBelowThreshold: hideInput.checked });
    const items = (container as any).currentItems || [];
    updateAnalysis(items, container, true);
  });

  personalInput.addEventListener('change', async () => {
    await updateSettings({ personalMode: personalInput.checked });
    const items = (container as any).currentItems || [];
    updateAnalysis(items, container, true);
  });

  return panel;
}

export const createMainUI = async (): Promise<HTMLElement> => {
  try {
    const container = document.createElement('div');
    container.className = 'market-analysis-container';

    // Create header
    const header = document.createElement('div');
    header.className = 'market-analysis-header';

    const title = document.createElement('span');
    title.className = 'market-analysis-title';
    title.textContent = 'Market Analysis';

    const controls = document.createElement('div');
    controls.className = 'header-controls';

    const minimizeBtn = document.createElement('button');
    minimizeBtn.className = 'header-button';
    minimizeBtn.textContent = '−';
    minimizeBtn.onclick = () => {
      container.classList.toggle('market-analysis-minimized');
      minimizeBtn.textContent = container.classList.contains('market-analysis-minimized') ? '+' : '−';
    };

    controls.appendChild(minimizeBtn);

    header.appendChild(title);
    header.appendChild(controls);

    // Create content container
    const content = document.createElement('div');
    content.className = 'market-analysis-content';

    container.appendChild(header);
    container.appendChild(content);

    let currentItems: MarketItem[] = [];

    // Store reference to items for updates
    (container as any).updateAnalysis = (items: MarketItem[]) => {
      const isInSettings = document.querySelector('.game-tab.active')?.textContent === 'Settings';
      
      // Find existing cards and check for updates
      const content = container.querySelector('.market-analysis-content');
      if (content) {
        const cards = content.querySelectorAll('.item-card');
        cards.forEach(card => {
          const itemName = card.querySelector('.item-name')?.textContent;
          const updatedItem = items.find(item => item.name === itemName);
          
          if (updatedItem) {
            const previousProfit = parseFloat((card as HTMLElement).dataset.previousProfit || '0');
            const previousNetPrice = parseFloat((card as HTMLElement).dataset.previousNetPrice || '0');
            
            if (updatedItem.profit !== previousProfit || updatedItem.netPrice !== previousNetPrice) {
              card.classList.remove('updated', 'outdated');
              // Trigger reflow to restart animation
              void (card as HTMLElement).offsetWidth;
              card.classList.add('updated');
              
              // Update stored values
              (card as HTMLElement).dataset.previousProfit = updatedItem.profit?.toString() || '';
              (card as HTMLElement).dataset.previousNetPrice = updatedItem.netPrice?.toString() || '';
            }
          }
        });
      }
      
      currentItems = items;
      updateAnalysis(items, container, isInSettings);
    };

    // Add styles
    const styles = createStyles();
    document.head.appendChild(styles);

    // Immediately show items from storage
    const { getAllItems } = await import('../services/storageService');
    const storedItems = await getAllItems();
    if (storedItems.length > 0) {
      updateAnalysis(storedItems, container, false);
      // Mark items as outdated until fresh data arrives
      const cards = content.querySelectorAll('.item-card');
      cards.forEach(card => card.classList.add('outdated'));
    }

    return container;
  } catch (error) {
    log.e(`Failed to create UI: ${error}`);
    throw error;
  }
};

const detectGameFromUrl = (url: string): string | null => {
  const gamePatterns = [
    { pattern: /730|CS2|csgo|cs2/i, game: 'CS2' },
    { pattern: /440|TF2|tf2/i, game: 'TF2' },
    { pattern: /570|Dota|dota2/i, game: 'Dota 2' },
    // Add more games as needed
  ];

  for (const { pattern, game } of gamePatterns) {
    if (pattern.test(url)) {
      return game;
    }
  }
  return null;
};

export const updateAnalysis = async (items: MarketItem[], container: HTMLElement, isSettings: boolean = false) => {
  try {
    const content = container.querySelector('.market-analysis-content');
    if (!content) return;

    // Store items reference
    (container as any).currentItems = items;

    // Normalize game names in items
    const normalizedItems = items.map(item => ({
      ...item,
      game: normalizeGameName(item.game)
    }));

    // Get unique games
    const availableGames = [...new Set(normalizedItems.map(item => item.game))];
    const tabs = [...availableGames, 'Settings'];
    
    // On first load or URL change, detect game from URL
    if (!localStorage.getItem('sma_active_game') || window.location.href !== localStorage.getItem('sma_last_url')) {
      const currentGame = detectGameFromUrl(window.location.href);
      if (currentGame && availableGames.includes(currentGame)) {
        localStorage.setItem('sma_active_game', currentGame);
      } else if (availableGames.length > 0) {
        localStorage.setItem('sma_active_game', availableGames[0]);
      }
      localStorage.setItem('sma_last_url', window.location.href);
    }
    
    // Get active tab (game or settings)
    let activeTab = isSettings ? 'Settings' : (localStorage.getItem('sma_active_game') || availableGames[0] || 'Unknown Game');
    
    // Ensure the active game exists in our items if not in settings
    if (!isSettings && !availableGames.includes(activeTab) && availableGames.length > 0) {
      activeTab = availableGames[0];
      localStorage.setItem('sma_active_game', activeTab);
    }

    // Create/update navigation
    let nav = container.querySelector('.game-navigation');
    if (nav) nav.remove();
    nav = document.createElement('div');
    nav.className = 'game-navigation';

    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'game-tabs';

    tabs.forEach(tab => {
      const tabEl = document.createElement('div');
      tabEl.className = `game-tab${tab === activeTab ? ' active' : ''}`;
      tabEl.textContent = tab;
      tabEl.onclick = () => {
        if (tab === 'Settings') {
          updateAnalysis(normalizedItems, container, true);
        } else {
          localStorage.setItem('sma_active_game', tab);
          updateAnalysis(normalizedItems, container, false);
        }
      };
      tabsContainer.appendChild(tabEl);
    });

    nav.appendChild(tabsContainer);
    container.insertBefore(nav, content);

    // Update content
    content.innerHTML = '';
    
    if (isSettings) {
      // Show settings panel
      const panel = await createSettingsPanel(container);
      panel.classList.add('visible');
      content.appendChild(panel);
    } else {
      // Show game items
      const gameItems = normalizedItems
        .filter(item => item.game === activeTab)
        // Sort by profit margin descending
        .sort((a, b) => (b.profitMargin || 0) - (a.profitMargin || 0));

      // Get settings for threshold filtering
      const settings = await getSettings();
      const hiddenCount = settings.hideBelowThreshold ? 
        gameItems.filter(item => (item.profitMargin || 0) < settings.profitThreshold).length : 0;
      
      // Filter items if hide below threshold is enabled
      const visibleItems = settings.hideBelowThreshold ? 
        gameItems.filter(item => (item.profitMargin || 0) >= settings.profitThreshold) : 
        gameItems;

      if (visibleItems.length > 0 || hiddenCount > 0) {
        // Show items
        visibleItems.forEach(item => {
          const card = createItemCard(item);
          if (item.url === window.location.href) {
            card.classList.add('current');
          }
          card.dataset.previousProfit = item.profit?.toString() || '';
          card.dataset.previousNetPrice = item.netPrice?.toString() || '';
          content.appendChild(card);
        });

        // Show hidden items count if any
        if (hiddenCount > 0) {
          const hiddenMsg = document.createElement('div');
          hiddenMsg.className = 'hidden-items-message';
          
          const msgText = document.createElement('span');
          msgText.textContent = `${hiddenCount} item${hiddenCount !== 1 ? 's' : ''} hidden (below ${settings.profitThreshold}% threshold)`;
          
          const toggleBtn = document.createElement('button');
          toggleBtn.className = 'toggle-hidden-btn';
          toggleBtn.textContent = 'Show Anyway';
          
          let isShowingHidden = false;
          toggleBtn.onclick = () => {
            isShowingHidden = !isShowingHidden;
            toggleBtn.textContent = isShowingHidden ? 'Hide Items' : 'Show Anyway';
            
            // Get hidden items
            const hiddenItems = gameItems.filter(item => (item.profitMargin || 0) < settings.profitThreshold);
            
            // Find existing hidden items container or create new one
            let hiddenContainer = content.querySelector('.hidden-items-container');
            if (!hiddenContainer) {
              hiddenContainer = document.createElement('div');
              hiddenContainer.className = 'hidden-items-container';
              content.appendChild(hiddenContainer);
            }
            
            if (isShowingHidden) {
              hiddenContainer.innerHTML = '';
              hiddenItems.forEach(item => {
                const card = createItemCard(item);
                card.classList.add('below-threshold');
                if (item.url === window.location.href) {
                  card.classList.add('current');
                }
                hiddenContainer.appendChild(card);
              });
            } else {
              hiddenContainer.innerHTML = '';
            }
          };
          
          hiddenMsg.appendChild(msgText);
          hiddenMsg.appendChild(toggleBtn);
          content.appendChild(hiddenMsg);
        }
      }
    }
  } catch (error) {
    log.e(`Failed to update analysis: ${error}`);
  }
};

// Helper function to normalize game names
const normalizeGameName = (game: string): string => {
  const gameMap: { [key: string]: string } = {
    'CS2': 'CS2',
    'CSGO': 'CS2',
    'Counter-Strike 2': 'CS2',
    'Counter-Strike: Global Offensive': 'CS2',
    'TF2': 'TF2',
    'Team Fortress 2': 'TF2',
    'Dota 2': 'Dota 2',
    'DOTA2': 'Dota 2'
  };
  return gameMap[game] || game;
}; 