export const createHiddenItemsMessage = (
  hiddenCount: number,
  threshold: number,
  onToggle: (isShowing: boolean) => void
): HTMLElement => {
  const hiddenMsg = document.createElement('div');
  hiddenMsg.className = 'hidden-items-message';
  
  const msgText = document.createElement('span');
  msgText.textContent = `${hiddenCount} item${hiddenCount !== 1 ? 's' : ''} hidden (below ${threshold}% threshold)`;
  
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'toggle-hidden-btn';
  toggleBtn.textContent = 'Show Anyway';
  
  let isShowingHidden = false;
  toggleBtn.onclick = () => {
    isShowingHidden = !isShowingHidden;
    toggleBtn.textContent = isShowingHidden ? 'Hide Items' : 'Show Anyway';
    onToggle(isShowingHidden);
  };
  
  hiddenMsg.appendChild(msgText);
  hiddenMsg.appendChild(toggleBtn);
  
  return hiddenMsg;
}; 