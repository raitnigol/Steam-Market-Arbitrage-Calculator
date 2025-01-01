export const settingsStyles = `
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
`; 