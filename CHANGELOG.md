# Changelog

## [1.0.0] - 2024-12-22
### Added
- Initial release
- Real-time arbitrage calculations
- Dynamic fee calculator
- Game-specific item grouping
- Stats & Goals tracking
- Settings management
- Filtering and sorting capabilities

## [1.0.1] - 2024-12-22
### Changed
- **Code Refactoring / Cleanup**  
  - Introduced jQuery for DOM manipulation to reduce code complexity and line count
  - Consolidated logging functions into a single `log` object
  - Combined and simplified helper functions (`waitForElement`, `calcFee`, etc.)
  - Streamlined UI generation with jQuery chaining (`.html()`, `.css()`, `.on()` events)

### Fixed
- Minor consistency issues in displaying notifications
- Potential overlap of “page changed” checks during fetch attempts

### Notes
- This version retains the same functionality as v1.0.0 but is significantly more compact and easier to maintain.
- If you previously installed via Tampermonkey, your script should auto-update or prompt for update (depending on your settings).

## [1.0.2] - 2024-12-22
### Added
- **In-Memory Caching for Data Requests**: Reduces redundant API calls, improving efficiency and reducing the likelihood of hitting rate limits.
- **Exponential Backoff for 429 Errors**: Handles rate-limited requests with progressively delayed retries.
- **Detailed Error Notifications**: Improved user feedback for fetch failures or invalid price data.
- **External Market Price Integration**: Fetches and displays external price comparisons for better arbitrage decisions.
- **Sales Stats**: Tracks daily, weekly, and monthly sales for each item to help identify liquid markets.

### Changed
- **UI Enhancements**:
  - Improved item grouping and presentation with clear profit, fees, and sales details.
  - New compact item display format for better readability and reduced clutter.
  - Enhanced filtering and sorting capabilities for tracked items.
  - Modernized visual style with better color coding for profit margins.
- **Dynamic Fee Adjustments**: Improved calculation logic for accurate fees across different price ranges.
- **Refactored Fetch Logic**:
  - Introduced a `fetchRetry` function to handle retries, caching, and error recovery.

### Fixed
- **Notification Bugs**: Resolved issues with inconsistent or missing user notifications for high-profit items.
- **Profit Margin Calculations**: Corrected rounding and display errors in percentage calculations.
- **Page Transition Handling**: Script now stops redundant fetch attempts on page changes, preventing stale data.

### Notes
- This update significantly enhances functionality and performance. Users are encouraged to update for the latest features and fixes.
