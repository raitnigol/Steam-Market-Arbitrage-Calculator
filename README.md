# Steam Market Arbitrage Calculator

A powerful userscript for analyzing and tracking profitable trading opportunities on the Steam Community Market. Supports CS2, TF2, Dota 2, and Steam items.

## Features

- 📊 Real-time market analysis
- 💰 Profit calculation with accurate fee handling
- 🎮 Multi-game support (CS2, TF2, Dota 2, Steam items)
- 📈 Personal investment tracking
- ⚙️ Configurable profit thresholds
- 💾 Data import/export functionality
- 🔍 SIH price integration
- 🎯 Smart item filtering
- 📱 Responsive UI with minimize option

## Installation

1. Install a userscript manager (e.g., Tampermonkey, Violentmonkey)
2. Install Steam Inventory Helper (SIH) extension
3. Install this userscript from the latest release

## Usage

1. Navigate to any Steam Market listing
2. The analysis panel will appear automatically
3. Configure your settings:
   - Set profit threshold
   - Enable/disable item filtering
   - Toggle personal tracking mode
4. Track your investments and potential profits

## Development

```bash
# Install dependencies
npm install

# Start development with watch mode
npm run dev

# Build for production
npm run build
```

## Configuration

- **Profit Threshold**: Set minimum profit percentage for highlighting items
- **Hide Below Threshold**: Option to hide items below profit threshold
- **Personal Mode**: Track your actual purchase prices and profits
- **Analytics Mode**: View detailed market data

## Fee Calculation

- Steam items: Flat 15% fee
- Game items: Dynamic fee structure based on price ranges
- Special handling for different price brackets

## Data Management

- Export your data as JSON
- Import previous exports
- Automatic data cleanup (configurable intervals)

## Browser Support

- Chrome/Chromium-based browsers
- Firefox
- Edge

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This is free and unencumbered software released into the public domain under The Unlicense.

Anyone is free to copy, modify, publish, use, compile, sell, or distribute this software, either in source code form or as a compiled binary, for any purpose, commercial or non-commercial, and by any means.

For more information, please refer to [https://unlicense.org/](https://unlicense.org/)

## Author

Rait Nigol
- Website: [nigol.ee](https://nigol.ee)
- GitHub: [@raitnigol](https://github.com/raitnigol)

## Acknowledgments

- Steam Inventory Helper (SIH) for price data
- Steam Community Market for the platform
