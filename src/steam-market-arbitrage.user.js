// ==UserScript==
// @name         Steam Market Arbitrage Calculator (SIH)
// @namespace    https://github.com/raitnigol/steam-market-arbitrage
// @version      1.0.0
// @description  Automated arbitrage calculator for Steam Community Market using SIH prices. Features profit tracking, dynamic fees, stats, and Steam hardware goals.
// @author       Rait Nigol
// @homepage     https://nigol.ee
// @supportURL   https://github.com/raitnigol/Steam-Market-Arbitrage-Calculator/issues
// @updateURL    https://raw.githubusercontent.com/raitnigol/Steam-Market-Arbitrage-Calculator/main/steam-market-arbitrage.user.js
// @downloadURL  https://raw.githubusercontent.com/raitnigol/Steam-Market-Arbitrage-Calculator/main/steam-market-arbitrage.user.js
// @match        https://steamcommunity.com/market/listings/*
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.notification
// @license      Unlicense
// @icon         https://store.steampowered.com/favicon.ico
// ==/UserScript==

(async function () {
    'use strict';

    /*************************************
     *          GM STORAGE KEYS
     *************************************/
    const DATA_KEY               = "steamListingTracker_DATA";
    const LAST_RESET_TIME_KEY    = "steamListingTracker_LAST_RESET_TIME";
    const RESET_INTERVAL_KEY     = "steamListingTracker_RESET_INTERVAL";
    const PROFIT_THRESHOLD_KEY   = "steamListingTracker_PROFIT_THRESHOLD";

    // Default settings if not found in GM
    const DEFAULT_RESET_INTERVAL   = 6 * 60 * 60 * 1000; // 6 hours
    const DEFAULT_PROFIT_THRESHOLD = 0; // 0% by default

    /*************************************
     *             CONSTANTS
     *************************************/
    const REQUEST_DELAY     = 5000;  // Min delay between requests
    const MAX_RETRIES       = 5;     // Max retries for fetch
    const MAX_BACKOFF_TIME  = 30000; // 30 seconds cap
    const CACHE_EXPIRATION  = 30 * 60 * 1000; // 30 minutes
    const DEBUG_LOGGING     = true;  // Set false to reduce console chatter

    // For "Goals" calculations
    const STEAM_DECK_PRICE  = 569;   // Steam Deck OLED 512GB
    const VR_KIT_PRICE      = 1079;  // Valve Index VR Kit

    /*************************************
     *      IN-MEMORY RUNTIME VARIABLES
     *************************************/
    let lastRequestTime = 0;
    const cache         = {}; // In-memory cache for session
    let currentPageUrl  = window.location.href;

    /*************************************
     *       HELPER: LOGGING WRAPPER
     *************************************/
    function logDebug(...args) {
        if (DEBUG_LOGGING) console.debug("[SteamTracker][DEBUG]", ...args);
    }
    function logInfo(...args) {
        console.info("[SteamTracker][INFO]", ...args);
    }
    function logError(...args) {
        console.error("[SteamTracker][ERROR]", ...args);
    }
    function logWarn(...args) {
        console.warn("[SteamTracker][WARN]", ...args);
    }

    /*************************************
     *        HELPER: WAIT FOR ELEMENT
     *************************************/
    async function waitForElement(selector, timeout = 10000) {
        const interval = 100;
        const maxAttempts = timeout / interval;
        let attempts = 0;

        while (attempts < maxAttempts) {
            const element = document.querySelector(selector);
            if (element) return element;
            await new Promise(resolve => setTimeout(resolve, interval));
            attempts++;
        }
        throw new Error(`Element not found: ${selector}`);
    }

    /*************************************
     *       URL PARSING FOR ITEM ID
     *  Steam listing URL looks like:
     *  /market/listings/730/AWP%20|%20Asiimov
     *  => appId = 730, itemNameEncoded = AWP%20|%20Asiimov
     *************************************/
    function parseItemIdFromUrl() {
        // e.g. path = "/market/listings/730/AWP%20Asiimov"
        const path = window.location.pathname;
        const match = path.match(/\/market\/listings\/(\d+)\/(.+)/);
        if (!match) {
            return { appId: null, itemNameEncoded: null };
        }
        return {
            appId: match[1],
            itemNameEncoded: match[2]
        };
    }

    /*************************************
     *       PAGE + FEE DETECTION
     *************************************/
    function detectGame() {
        const gameNameElement = document.querySelector("#largeiteminfo_game_name");
        return gameNameElement ? gameNameElement.textContent.trim() : "default";
    }

    function isPageChanged() {
        return window.location.href !== currentPageUrl;
    }

    /**
     * Approximate Steam cut with a dynamic approach:
     * For small amounts, the percentage is higher (e.g. 20% at 0.10).
     * For larger amounts, ~13%. We also display net if we used a flat 15%.
     */
    function calculateDynamicSteamFee(buyerPays) {
        let net, approxFeeRate;
        if (buyerPays <= 1.0) {
            // Simple linear approach from ~20% down to ~12%
            approxFeeRate = 0.20 - (buyerPays * 0.08);
            if (approxFeeRate < 0.12) approxFeeRate = 0.12;
            if (approxFeeRate > 0.20) approxFeeRate = 0.20;
        } else {
            approxFeeRate = 0.13; // ~13% for amounts above 1 EUR
        }
        net = buyerPays * (1 - approxFeeRate);
        // Mimic steam rounding
        net = Math.floor(net * 100) / 100;

        // Also compute net if we used a pure 15% for reference
        const netUsing15Percent = Math.floor((buyerPays * (1 - 0.15)) * 100) / 100;

        return {
            net,
            netUsing15Percent,
            feeRateUsed: approxFeeRate
        };
    }

    /*************************************
     *        RESET LOGIC
     *************************************/
    async function resetDatabaseIfNeeded() {
        const lastReset = await GM.getValue(LAST_RESET_TIME_KEY, null);
        const now = Date.now();
        const userDefinedInterval = await GM.getValue(RESET_INTERVAL_KEY, DEFAULT_RESET_INTERVAL);

        if (!lastReset || now - new Date(lastReset).getTime() > userDefinedInterval) {
            logInfo("Resetting database due to interval expiry...");
            await GM.setValue(DATA_KEY, []);
            await GM.setValue(LAST_RESET_TIME_KEY, new Date().toISOString());
        }
    }

    /*************************************
     *        FETCH WITH RETRIES
     * Includes exponential backoff with cap
     *************************************/
    async function fetchWithRetry(url) {
        let delayTime = 1000; // Start with 1 second
        for (let i = 0; i < MAX_RETRIES; i++) {
            if (isPageChanged()) {
                logInfo("Page changed, halting fetch operation.");
                return null;
            }

            const now = Date.now();
            if (now - lastRequestTime < REQUEST_DELAY) {
                const waitMs = REQUEST_DELAY - (now - lastRequestTime);
                logDebug(`Waiting ${waitMs}ms to respect REQUEST_DELAY`);
                await new Promise(resolve => setTimeout(resolve, waitMs));
            }
            lastRequestTime = Date.now();

            try {
                const response = await fetch(url);
                if (response.ok) {
                    // On success, reset the backoff
                    delayTime = 1000;
                    return await response.json();
                }

                if (response.status === 429) {
                    logWarn(`Rate limit (429). Retrying in ${delayTime}ms (attempt ${i + 1}/${MAX_RETRIES})...`);
                    await new Promise(resolve => setTimeout(resolve, delayTime));
                    delayTime = Math.min(delayTime * 2, MAX_BACKOFF_TIME);
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            } catch (error) {
                logError(`Fetch attempt ${i + 1} failed:`, error);
            }
        }
        logError("All retries failed for URL: " + url);
        return null;
    }

    /*************************************
     *       FETCH w/ CACHING
     *************************************/
    async function getCachedData(itemId) {
        if (cache[itemId] && Date.now() - cache[itemId].timestamp < CACHE_EXPIRATION) {
            return cache[itemId].data;
        }
        const data = await fetchWithRetry(`https://steamcommunity.com/market/itemordersactivity?item_nameid=${itemId}`);
        if (data) {
            cache[itemId] = { data, timestamp: Date.now() };
        }
        return data;
    }

    /*************************************
     *   MERGE & STORE TRACKED ITEM
     * (Multi-tab safe approach)
     *************************************/
    async function addOrUpdateItem(newData) {
        let items = await GM.getValue(DATA_KEY, []);
        const existingIndex = items.findIndex(item => item.name === newData.name);
        if (existingIndex !== -1) {
            items[existingIndex] = newData;
            logDebug("Updated item in DB:", newData);
        } else {
            items.push(newData);
            logDebug("Added new item to DB:", newData);
        }
        await GM.setValue(DATA_KEY, items);
    }

    /*************************************
     *        REMOVE ITEM BY NAME
     *************************************/
    async function removeItemByName(name) {
        let items = await GM.getValue(DATA_KEY, []);
        items = items.filter(i => i.name !== name);
        await GM.setValue(DATA_KEY, items);
        displayTrackedItems(); // re-render
    }

    /*************************************
     *        REMOVE ALL ITEMS
     *************************************/
    async function removeAllItems() {
        await GM.setValue(DATA_KEY, []);
        displayTrackedItems(); // re-render
    }

    /*************************************
     *   SHOW FAILURE NOTIFICATION (UI)
     *************************************/
    function showFailureNotification(message) {
        const notifArea = document.querySelector("#steamTracker_notificationArea");
        if (notifArea) {
            const div = document.createElement("div");
            div.style.color = "red";
            div.style.marginBottom = "5px";
            div.textContent = message;
            notifArea.appendChild(div);
        }
        logError(message);
    }

    /*************************************
     *        DISPLAY TRACKED ITEMS
     *************************************/
    async function displayTrackedItems() {
        const items = await GM.getValue(DATA_KEY, []);
        // Group by game
        const itemsByGame = items.reduce((acc, item) => {
            if (!acc[item.game]) acc[item.game] = [];
            acc[item.game].push(item);
            return acc;
        }, {});

        // Build tabs list from game names + "Stats & Goals" + "Settings"
        const tabs = Object.keys(itemsByGame).concat(["Stats & Goals", "Settings"]);

        let box = document.querySelector("#steamTracker_trackedItemsBox");
        if (!box) {
            box = document.createElement('div');
            box.id = "steamTracker_trackedItemsBox";
            box.style.cssText = `
                position: fixed;
                top: 10px;
                left: 10px;
                background-color: #2c2c2c;
                color: #f9f9f9;
                padding: 15px;
                border: 1px solid #444;
                border-radius: 8px;
                z-index: 999999;
                max-height: 500px;
                overflow-y: auto;
                box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.7);
                font-family: Arial, sans-serif;
                font-size: 13px;
            `;
            document.body.appendChild(box);
        }

        // UI scaffolding
        box.innerHTML = `
            <div style="display: flex; gap: 5px; margin-bottom: 10px;">
                <button id="steamTracker_closeBtn" style="background: #d33; color: white; border: none; padding: 5px 8px; cursor: pointer; border-radius: 4px;">X</button>
                <button id="steamTracker_minimizeBtn" style="background: #555; color: white; border: none; padding: 5px 8px; cursor: pointer; border-radius: 4px;">-</button>
                ${tabs.map(tab => `
                    <button class="steamTracker_tabButton" data-tab="${tab}" style="
                        background: #0073e6;
                        color: white;
                        border: none;
                        padding: 5px 10px;
                        cursor: pointer;
                        border-radius: 4px;
                        font-size: 12px;
                    ">${tab}</button>
                `).join("")}
            </div>
            <!-- Filter + Sort row -->
            <div id="steamTracker_filterSortRow" style="margin-bottom: 10px;">
                <input type="text" id="steamTracker_filterInput" placeholder="Filter by name..." style="padding:3px;width:120px;" />
                <select id="steamTracker_sortSelect" style="padding:3px;">
                    <option value="nameAsc">Name (A→Z)</option>
                    <option value="nameDesc">Name (Z→A)</option>
                    <option value="profitAsc">Profit (Asc)</option>
                    <option value="profitDesc" selected>Profit (Desc)</option>
                </select>
                <button id="steamTracker_applyFilterSort" style="background: #28a745; color: white; border: none; padding: 5px 8px; cursor: pointer; border-radius: 4px;">
                    Apply
                </button>
            </div>
            <div id="steamTracker_notificationArea" style="margin-bottom: 5px;"></div>
            <div id="steamTracker_tabContent" style="margin-top: 10px;"></div>
        `;

        // close/minimize listeners
        document.querySelector("#steamTracker_closeBtn").addEventListener("click", () => box.remove());
        document.querySelector("#steamTracker_minimizeBtn").addEventListener("click", () => {
            const content = document.querySelector("#steamTracker_tabContent");
            const filterRow = document.querySelector("#steamTracker_filterSortRow");
            if (content.style.display === "none") {
                content.style.display = "block";
                filterRow.style.display = "block";
            } else {
                content.style.display = "none";
                filterRow.style.display = "none";
            }
        });

        // Tab switching
        const tabContent = box.querySelector("#steamTracker_tabContent");
        document.querySelectorAll(".steamTracker_tabButton").forEach(button => {
            button.addEventListener("click", () => {
                const tab = button.getAttribute("data-tab");
                renderTabContent(tab, itemsByGame, items, tabContent);
            });
        });

        // Filter & sort
        document.querySelector("#steamTracker_applyFilterSort").addEventListener("click", () => {
            const activeTabBtn = document.querySelector(".steamTracker_tabButton.active");
            if (activeTabBtn) {
                const activeTab = activeTabBtn.getAttribute("data-tab");
                renderTabContent(activeTab, itemsByGame, items, tabContent);
            }
        });

        // Auto-click the first tab if it exists or fallback
        const firstTabBtn = document.querySelector(".steamTracker_tabButton");
        if (firstTabBtn) {
            firstTabBtn.click();
        }
    }

    /*************************************
     *   RENDER TAB CONTENT (CORE)
     *************************************/
    async function renderTabContent(tab, itemsByGame, allItems, containerEl) {
        // Mark active tab
        document.querySelectorAll(".steamTracker_tabButton").forEach(btn => btn.classList.remove("active"));
        const thisBtn = document.querySelector(`.steamTracker_tabButton[data-tab='${tab}']`);
        if (thisBtn) thisBtn.classList.add("active");

        const filterText = (document.querySelector("#steamTracker_filterInput")?.value || "").toLowerCase();
        const sortMode   = document.querySelector("#steamTracker_sortSelect")?.value || "profitDesc";

        // SETTINGS TAB
        if (tab === "Settings") {
            containerEl.innerHTML = buildSettingsHTML();
            attachSettingsListeners();
            return;
        }

        // STATS & GOALS TAB
        if (tab === "Stats & Goals") {
            containerEl.innerHTML = buildStatsGoalsHTML(allItems);
            return;
        }

        // ELSE: It's a game tab
        const items = itemsByGame[tab] || [];

        // Filter
        let filteredItems = items.filter(item => item.name.toLowerCase().includes(filterText));

        // Sort
        switch (sortMode) {
            case "nameAsc":
                filteredItems.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case "nameDesc":
                filteredItems.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case "profitAsc":
                filteredItems.sort((a, b) => a.profitMargin - b.profitMargin);
                break;
            default: // "profitDesc"
                filteredItems.sort((a, b) => b.profitMargin - a.profitMargin);
                break;
        }

        containerEl.innerHTML = `
            <button id="steamTracker_deleteAllBtn" style="background: #d33; color: white; border: none; padding: 4px 6px; cursor: pointer; border-radius: 4px; margin-bottom:10px;">
                Delete All Items
            </button>
            ${filteredItems.map((item, idx) => {
                // color if profit >= threshold
                const itemColor = item.profitMargin >= (item.thresholdUsed || 0)
                    ? "lightgreen" : "white";
                return `
                    <div style="padding: 5px 10px; border-bottom: 1px solid #555; color: ${itemColor}; display:flex; align-items:center; justify-content:space-between;">
                        <div>
                            ${idx + 1}.
                            <a href="${item.url}" target="_blank" style="color: #4da6ff; text-decoration: none;">
                                ${item.name}
                            </a> (AppID: ${item.appId || "?"})
                            <br/>
                            <small>
                                Buyer Quicksell: ${item.quicksellPrice.toFixed(2)}€
                                => Net: ${item.netQuicksellPrice.toFixed(2)}€
                                (Approx fee: ${Math.round(item.feeRateUsed * 100)}%)
                            </small>
                            <br/>
                            <small>SIH: ${item.sihPrice.toFixed(2)}€
                                   | Profit: ${item.profitMargin.toFixed(2)}% (${item.diff.toFixed(2)}€)
                            </small>
                            <br/>
                            <small style="color:#aaa;">
                                [15% ref: ${item.netQuicksellPrice15.toFixed(2)}€]
                            </small>
                        </div>
                        <span class="steamTracker_removeItem" data-item-name="${item.name}"
                              style="color: #d33; cursor: pointer; font-weight:bold; margin-left:10px;">
                            ✖
                        </span>
                    </div>
                `;
            }).join("")}
        `;

        // Attach "Delete All" listener
        const deleteAllBtn = containerEl.querySelector("#steamTracker_deleteAllBtn");
        if (deleteAllBtn) {
            deleteAllBtn.addEventListener("click", () => {
                if (confirm("Are you sure you want to delete ALL tracked items?")) {
                    removeAllItems();
                }
            });
        }

        // Attach per-item remove
        containerEl.querySelectorAll(".steamTracker_removeItem").forEach(el => {
            el.addEventListener("click", e => {
                const itemName = e.currentTarget.getAttribute("data-item-name");
                if (itemName && confirm(`Remove "${itemName}"?`)) {
                    removeItemByName(itemName);
                }
            });
        });
    }

    /*************************************
     *   BUILD HTML FOR SETTINGS TAB
     *************************************/
    function buildSettingsHTML() {
        return `
            <h3 style="margin-top:0;">Settings</h3>
            <label style="display:block;margin-bottom:8px;">
                Purge Interval (hours):
                <input type="number" min="1" id="steamTracker_settings_purgeInterval" style="width:60px;" />
            </label>
            <label style="display:block;margin-bottom:8px;">
                Profit Threshold (%):
                <input type="number" id="steamTracker_settings_profitThreshold" style="width:60px;" />
            </label>
            <button id="steamTracker_settings_saveBtn" style="background: #28a745; color: white; padding: 5px 10px; border:none; border-radius:4px; cursor:pointer;">
                Save Settings
            </button>
        `;
    }

    /*************************************
     *    ATTACH SETTINGS LISTENERS
     *************************************/
    async function attachSettingsListeners() {
        const purgeInput = document.querySelector("#steamTracker_settings_purgeInterval");
        const profitInput = document.querySelector("#steamTracker_settings_profitThreshold");

        const currentIntervalMs = await GM.getValue(RESET_INTERVAL_KEY, DEFAULT_RESET_INTERVAL);
        const currentProfitTh   = await GM.getValue(PROFIT_THRESHOLD_KEY, DEFAULT_PROFIT_THRESHOLD);

        purgeInput.value  = (currentIntervalMs / 3600000) || 6;
        profitInput.value = currentProfitTh;

        document.querySelector("#steamTracker_settings_saveBtn").addEventListener("click", async () => {
            const hours = parseFloat(purgeInput.value);
            const profitThVal = parseFloat(profitInput.value);

            if (isNaN(hours) || hours < 1) {
                alert("Purge interval must be >= 1 hour.");
                return;
            }
            if (isNaN(profitThVal)) {
                alert("Profit threshold must be a valid number.");
                return;
            }

            await GM.setValue(RESET_INTERVAL_KEY, hours * 3600000);
            await GM.setValue(PROFIT_THRESHOLD_KEY, profitThVal);

            alert("Settings saved!");
        });
    }

    /*************************************
     *  BUILD HTML FOR STATS & GOALS TAB
     *************************************/
    function buildStatsGoalsHTML(allItems) {
        if (!allItems || allItems.length === 0) {
            return `<p>No items tracked yet.</p>`;
        }

        // 1) total items
        const totalItems = allItems.length;

        // 2) highest profit item
        let highestProfitItem = null;
        if (allItems.length > 0) {
            highestProfitItem = allItems.reduce((max, item) => {
                return item.profitMargin > max.profitMargin ? item : max;
            }, allItems[0]);
        }

        if (!highestProfitItem) {
            return `
                <h3 style="margin-top:0;">Stats & Goals</h3>
                <p><strong>Total items tracked:</strong> ${totalItems}</p>
                <p>No highest profit item found yet.</p>
            `;
        }

        // Calculate how many of the highest-profit item you'd need to buy at SIH price
        // to get ~569€ or ~1079€ from net quicksell.
        const deckNeededCount = Math.ceil(STEAM_DECK_PRICE / highestProfitItem.netQuicksellPrice);
        const deckTotalCost   = (deckNeededCount * highestProfitItem.sihPrice).toFixed(2);

        const vrNeededCount   = Math.ceil(VR_KIT_PRICE / highestProfitItem.netQuicksellPrice);
        const vrTotalCost     = (vrNeededCount * highestProfitItem.sihPrice).toFixed(2);

        return `
            <h3 style="margin-top:0;">Stats & Goals</h3>
            <div style="margin-bottom:8px;">
                <strong>Total items tracked:</strong> ${totalItems}
            </div>
            <div style="margin-bottom:8px;">
                <strong>Highest Profit Item:</strong>
                <span style="color: lightgreen; font-weight:bold;">
                    ${highestProfitItem.name} (${highestProfitItem.profitMargin.toFixed(2)}%)
                </span>
            </div>
            <hr/>
            <div style="margin-bottom:8px;">
                <strong>Steam Deck (569€) using highest-profit item:</strong>
                <p style="margin:4px 0;">
                    You'd buy <em>${deckNeededCount}</em> × <em>${highestProfitItem.sihPrice.toFixed(2)}€</em>
                    = <em>${deckTotalCost}€</em> of real money, to generate ~569€ in Steam wallet.
                </p>
            </div>
            <div style="margin-bottom:8px;">
                <strong>Valve Index VR Kit (1079€) using highest-profit item:</strong>
                <p style="margin:4px 0;">
                    You'd buy <em>${vrNeededCount}</em> × <em>${highestProfitItem.sihPrice.toFixed(2)}€</em>
                    = <em>${vrTotalCost}€</em> of real money, to generate ~1079€ in Steam wallet.
                </p>
            </div>
        `;
    }

    /*************************************
     *          MAIN SCRIPT LOGIC
     *************************************/
    async function main() {
        logInfo("Script started (Enhanced + Stats).");
        await resetDatabaseIfNeeded();

        try {
            const nameEl = await waitForElement('.market_listing_item_name');
            const name   = nameEl.textContent.trim();
            const url    = window.location.href;
            const gameName = detectGame();

            // parse item ID from URL
            const { appId, itemNameEncoded } = parseItemIdFromUrl();

            // fetch quicksell price element
            const quicksellPriceEl = await waitForElement('#market_commodity_buyrequests .market_commodity_orders_header_promote:nth-child(2)');
            const quicksellRawStr  = quicksellPriceEl.textContent.trim().replace(/[^0-9.,-]/g, '').replace(',', '.');
            const quicksellPrice   = parseFloat(quicksellRawStr);
            if (isNaN(quicksellPrice)) {
                throw new Error("Invalid or missing quicksell price.");
            }

            // fetch SIH price element
            const sihPriceEl = await waitForElement('#sih_block_best_offer_of_marketplace_tabs_2 .sih_market__price');
            const sihRawStr  = sihPriceEl.textContent.trim().replace(/[^0-9.,-]/g, '').replace(',', '.');
            const sihPrice   = parseFloat(sihRawStr);
            if (isNaN(sihPrice)) {
                throw new Error("Invalid or missing SIH price.");
            }

            // dynamic fee calc
            const { net: netDynamic, netUsing15Percent, feeRateUsed } = calculateDynamicSteamFee(quicksellPrice);

            const diff         = netDynamic - sihPrice;
            const profitMargin = (diff / sihPrice) * 100;

            // user threshold
            const userProfitThreshold = await GM.getValue(PROFIT_THRESHOLD_KEY, DEFAULT_PROFIT_THRESHOLD);

            // build item record
            const newItem = {
                name,
                url,
                appId,
                quicksellPrice,
                sihPrice,
                netQuicksellPrice: netDynamic,
                netQuicksellPrice15: netUsing15Percent,
                diff,
                profitMargin,
                feeRateUsed,
                game: gameName,
                thresholdUsed: userProfitThreshold
            };
            await addOrUpdateItem(newItem);

            // Notification if >= threshold
            if (profitMargin >= userProfitThreshold && userProfitThreshold > 0) {
                GM.notification({
                    text: `High-profit item found: ${name} at ${profitMargin.toFixed(2)}% profit!`,
                    title: 'Steam Listing Tracker',
                    timeout: 5000
                });
            }

            // Show the UI
            displayTrackedItems();

        } catch (error) {
            showFailureNotification("Error: " + error.message);
            logError("An error occurred:", error);
        }
    }

    main();

    // TODO: [Future Feature] Implement historical data storage and trend charting
    // TODO: [Future Feature] Fallback selectors if Steam layout changes
    // TODO: [Future Feature] Central aggregator to fetch multiple listings at once
})();
