import { mainStyles } from './mainStyles';
import { cardStyles } from './cardStyles';
import { navigationStyles } from './navigationStyles';
import { settingsStyles } from './settingsStyles';

export const createStyles = (): HTMLStyleElement => {
  const style = document.createElement('style');
  style.textContent = `
    ${mainStyles}
    ${cardStyles}
    ${navigationStyles}
    ${settingsStyles}
  `;
  return style;
}; 