import type { MarketItem } from '../../types';

export const createGameNavigation = (
  items: MarketItem[],
  activeGame: string,
  onGameChange: (game: string) => void
): HTMLElement => {
  const nav = document.createElement('div');
  nav.className = 'game-navigation';

  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'game-tabs';

  // Get unique games
  const games = [...new Set(items.map(item => item.game))];
  const tabs = [...games, 'Settings'];

  // Create tabs
  if (games.length <= 4) {
    tabs.forEach(tab => {
      const tabEl = document.createElement('div');
      tabEl.className = `game-tab${tab === activeGame ? ' active' : ''}`;
      tabEl.textContent = tab;
      tabEl.onclick = () => onGameChange(tab);
      tabsContainer.appendChild(tabEl);
    });
  } else {
    // Show active game as tab
    const activeTab = document.createElement('div');
    activeTab.className = 'game-tab active';
    activeTab.textContent = activeGame;
    tabsContainer.appendChild(activeTab);

    // Add dropdown for other games
    const dropdown = document.createElement('div');
    dropdown.className = 'game-dropdown';
    
    const select = document.createElement('select');
    tabs.forEach(game => {
      const option = document.createElement('option');
      option.value = game;
      option.textContent = game;
      option.selected = game === activeGame;
      select.appendChild(option);
    });

    select.onchange = (e) => onGameChange((e.target as HTMLSelectElement).value);
    dropdown.appendChild(select);
    nav.appendChild(dropdown);
  }

  nav.appendChild(tabsContainer);
  return nav;
}; 