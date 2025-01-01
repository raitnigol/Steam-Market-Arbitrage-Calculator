export const createHeader = (onMinimize: () => void): HTMLElement => {
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
  minimizeBtn.onclick = onMinimize;

  controls.appendChild(minimizeBtn);
  header.appendChild(title);
  header.appendChild(controls);

  return header;
}; 