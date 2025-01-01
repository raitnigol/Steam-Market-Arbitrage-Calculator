import type { StorageSettings } from '../../types';
import { log } from '../../utils/logger';
import { getAllItems, getSettings, setItems, updateSettings } from '../../services/storageService';

interface SettingsPanelProps {
  container: HTMLElement;
  onUpdate: (items: any[]) => void;
}

export const createSettingsPanel = async ({ container, onUpdate }: SettingsPanelProps): Promise<HTMLElement> => {
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
      onUpdate(items);
      
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
      const items = await getAllItems();
      onUpdate(items);
    }
  });

  hideInput.addEventListener('change', async () => {
    await updateSettings({ hideBelowThreshold: hideInput.checked });
    const items = await getAllItems();
    onUpdate(items);
  });

  personalInput.addEventListener('change', async () => {
    await updateSettings({ personalMode: personalInput.checked });
    const items = await getAllItems();
    onUpdate(items);
  });

  return panel;
}; 