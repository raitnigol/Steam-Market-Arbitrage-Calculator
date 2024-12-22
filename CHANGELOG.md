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

