# Steam Market Arbitrage Calculator

An **automated arbitrage calculator** userscript that helps track profitable trading opportunities between Steam Community Market prices and Steam Inventory Helper (SIH) prices.

> **Disclaimer**: This code is primarily AI-generated and is provided under the [Unlicense](http://unlicense.org/). Use at your own risk.

## Features

- **Dynamic Steam fee calculations** for accurate profit estimation  
- **Profit threshold notifications** (optional)  
- **Floating UI** with tabs for different games  
- **Game-specific item grouping**  
- **Stats & Goals** tracking:
  - Highest-profit item  
  - Comparison of how many high-profit items are needed to reach Steam hardware prices (e.g., Steam Deck, Valve Index)  
- **Settings** for:
  - Auto-purge interval of tracked items  
  - Profit threshold  
- **Filter & Sort** items by name or profit (ascending/descending)

> **Note**: “Real-time” scanning for arbitrage is *not yet implemented*. Calculations occur upon visiting a listing page.

## Prerequisites

- **Google Chrome** (or another browser that supports Tampermonkey)  
- [Tampermonkey Extension](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)  
- [Steam Inventory Helper (SIH)](https://chrome.google.com/webstore/detail/steam-inventory-helper/cmeakgjggjdlcpncigglobpjbkabhmjl)

## Installation

1. **Install** Tampermonkey.  
2. **Install** Steam Inventory Helper.  
3. **Click here** to install the script directly:  
   - [steam-market-arbitrage.user.js](https://raw.githubusercontent.com/raitnigol/Steam-Market-Arbitrage-Calculator/main/steam-market-arbitrage.user.js)  
   OR  
   - Create a new userscript in Tampermonkey and copy-paste the contents of `steam-market-arbitrage.user.js`.

## Usage

1. Navigate to any **Steam Community Market listing**.
2. The script automatically:
   - Fetches SIH price & calculates potential profit vs. the Market’s quicksell price.
   - Calculates dynamic fees & net profit margin.
   - Tracks items for later reference in its floating UI.
3. Use the floating UI to:
   - View & filter items by **game**, **name**, or **profit**.
   - Check your **highest-profit item** and see how many such items you’d need to afford certain Steam hardware goals.
   - Adjust **Settings** (auto-purge interval, profit threshold).
   - Remove or purge items as needed.

## Screenshots

## Development

To contribute or modify:

1. Clone the repository:
```bash
git clone https://github.com/raitnigol/steam-market-arbitrage.git
```

2. Make changes in `src/steam-market-arbitrage.user.js`

3. Test by copying the updated script into Tampermonkey or by configuring @require to point to your local file.

## Disclaimer

- This script is for **educational purposes only**.
- Steam fees & market conditions change frequently. Always verify calculations manually.
- The script provides no guarantee of profit.
- **This project is Unlicensed and primarily AI-generated**; you can copy, modify, publish, or distribute as you wish.

## Support

- Found a bug? [Open an issue](https://github.com/raitnigol/steam-market-arbitrage/issues)
- Want to contribute? Create a pull request
- Questions? Open a [discussion](https://github.com/raitnigol/steam-market-arbitrage/discussions)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes.

## Author

**Rait Nigol**
- Website: [nigol.ee](https://nigol.ee)
- GitHub: [@raitnigol](https://github.com/raitnigol)

## License

This project is released under the Unlicense.
This means you can copy, modify, publish, use, compile, sell, or distribute this software, either in source code form or as a compiled binary, for any purpose, commercial or non-commercial, and by any means.

For more information, please refer to <http://unlicense.org/>
