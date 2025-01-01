export const navigationStyles = `
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
`; 