export const mainStyles = `
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

  .market-analysis-container.market-analysis-minimized {
    height: auto;
  }

  .market-analysis-container.market-analysis-minimized .market-analysis-content,
  .market-analysis-container.market-analysis-minimized .game-navigation {
    display: none;
  }
`; 