export const cardStyles = `
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

  .item-card.below-threshold {
    opacity: 0.7;
    border-left: 2px solid #ff7b7b;
  }
`; 