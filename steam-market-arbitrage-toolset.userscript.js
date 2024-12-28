// ==UserScript==
// @name         Steam Market Arbitrage Calculator (SIH) (1.0.4 stable)
// @namespace    https://github.com/raitnigol/Steam-Market-Arbitrage-Calculator
// @version      1.0.4
// @description  Automated arbitrage calculator for the Steam Community Market (using SIH prices) with dynamic fees, profit tracking, stats, and hardware goals.
// @author       Rait Nigol
// @homepage     https://nigol.ee
// @supportURL   https://github.com/raitnigol/Steam-Market-Arbitrage-Calculator/issues
// @updateURL    https://raw.githubusercontent.com/raitnigol/Steam-Market-Arbitrage-Calculator/main/steam-market-arbitrage.user.js
// @downloadURL  https://raw.githubusercontent.com/raitnigol/Steam-Market-Arbitrage-Calculator/main/steam-market-arbitrage.user.js
// @icon         https://store.steampowered.com/favicon.ico
// @match        https://steamcommunity.com/market/listings/*
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.notification
// @license      Unlicense
// ==/UserScript==

(async () => {
    'use strict';
  
    /*--- CONSTANTS & DEFAULTS ---*/
    const DATA_KEY = "steamListingTracker_DATA",
          LAST_RESET_TIME_KEY = "steamListingTracker_LAST_RESET_TIME",
          RESET_INTERVAL_KEY = "steamListingTracker_RESET_INTERVAL",
          PROFIT_THRESHOLD_KEY = "steamListingTracker_PROFIT_THRESHOLD",
          HIDE_BELOW_THRESHOLD_KEY = "steamListingTracker_HIDE_BELOW_THRESHOLD",
          PERSONAL_MODE_KEY = "steamListingTracker_PERSONAL_MODE",
          ANALYTICS_MODE_KEY = "steamListingTracker_ANALYTICS_MODE",
          DEFAULT_RESET_INTERVAL = 6 * 3600000, // 6 hours
          DEFAULT_PROFIT_THRESH = 0,
          DEFAULT_HIDE_BELOW_THRESHOLD = false,
          DEBUG_LOGGING = true,
          SIH_RETRY_ATTEMPTS = 10, // Number of times to retry finding SIH element
          SIH_RETRY_DELAY = 1000; // Delay between retries in ms;
  
    let currentPageUrl = location.href;
  
    /*--- LOG WRAPPERS ---*/
    const log = {
      d: (...a) => DEBUG_LOGGING && console.debug("[SteamTracker]", ...a),
      i: (...a) => console.info("[SteamTracker]", ...a),
      w: (...a) => console.warn("[SteamTracker]", ...a),
      e: (...a) => console.error("[SteamTracker]", ...a)
    };
  
    /*--- HELPER: PRICE FORMATTING ---*/
    const formatPrice = (price) => {
      if (typeof price === 'string') {
        // Remove any currency symbols and spaces
        const cleaned = price.replace(/[^0-9,.-]/g, '');
        // Handle both comma and dot as decimal separator
        // If there's both, assume comma is thousands separator
        if (cleaned.includes(',') && cleaned.includes('.')) {
          return parseFloat(cleaned.replace(',', ''));
        }
        // Otherwise replace comma with dot for decimal
        return parseFloat(cleaned.replace(',', '.'));
      }
      return price;
    };
  
    /*--- HELPER: WAIT FOR ELEM (jQuery) ---*/
    const waitForElement = async (sel, t = 10000, isSIH = false) => {
      for (let i = 0; i < (t / 100); i++) {
        const $el = $(sel);
        if ($el.length) return $el.first();
        await new Promise(r => setTimeout(r, 100));
      }
      
      // Special handling for SIH element
      if (isSIH) {
        log.w("SIH element not found initially, starting retry mechanism...");
        for (let i = 0; i < SIH_RETRY_ATTEMPTS; i++) {
          await new Promise(r => setTimeout(r, SIH_RETRY_DELAY));
          const $el = $(sel);
          if ($el.length) {
            log.i(`SIH element found after ${i + 1} retries`);
            return $el.first();
          }
          log.d(`SIH retry attempt ${i + 1} failed`);
        }
        throw new Error("SIH not loaded or not installed. Please ensure Steam Inventory Helper is installed and enabled.");
      }
      
      throw new Error(`Element not found: ${sel}`);
    };
  
    /*--- PAGE / URL / GAME DETECTION ---*/
    const parseItemIdFromUrl = () => {
      const m = location.pathname.match(/\/market\/listings\/(\d+)\/(.+)/);
      return m ? { appId: m[1], itemNameEncoded: m[2] } : { appId: null, itemNameEncoded: null };
    };
  
    const detectGame = () => {
      const gameName = $("#largeiteminfo_game_name").text().trim() || "default";
      return gameName === "CS2" ? "Counter-Strike 2" : gameName;
    };
  
    const isPageChanged = () => location.href !== currentPageUrl;
  
    /*--- FEE CALC ---*/
    const calcFee = (buyerPays) => {
      const rate = Math.max(0.12, Math.min((buyerPays <= 1.0) ? (0.20 - buyerPays * 0.08) : 0.13, 0.20));
      const net = buyerPays * (1 - rate), net15 = buyerPays * 0.85;
      return {
        net: Math.floor(net * 100) / 100,
        net15: Math.floor(net15 * 100) / 100,
        rate
      };
    };
  
    /*--- RESET IF NEEDED ---*/
    const resetIfNeeded = async () => {
      const personalMode = await GM.getValue(PERSONAL_MODE_KEY, false);
      if (personalMode) return; // Skip reset if in personal mode

      const [lr, int] = await Promise.all([
        GM.getValue(LAST_RESET_TIME_KEY, null),
        GM.getValue(RESET_INTERVAL_KEY, DEFAULT_RESET_INTERVAL)
      ]);
      const now = Date.now();
      if (!lr || (now - new Date(lr).getTime() > int)) {
        log.i("Reset DB (interval).");
        await Promise.all([
          GM.setValue(DATA_KEY, []),
          GM.setValue(LAST_RESET_TIME_KEY, new Date().toISOString())
        ]);
      }
    };
  
    /*--- GET / SET DATA ---*/
    const addOrUpdateItem = async (item) => {
      const items = await GM.getValue(DATA_KEY, []);
      const ix = items.findIndex(it => it.name === item.name);
      if (ix > -1) {
        // Preserve personal tracking data when updating
        const existingItem = items[ix];
        if (existingItem.boughtFor !== undefined) {
          item.boughtFor = existingItem.boughtFor;
          item.personalProfit = item.netQuicksellPrice - item.boughtFor;
          item.personalProfitPercent = (item.personalProfit / item.boughtFor) * 100;
        }
        items[ix] = item;
      } else {
        items.push(item);
      }
      await GM.setValue(DATA_KEY, items);
    };
  
    /*--- UI / DB OPS ---*/
    const removeItem = async (name) => {
      if (!await new Promise(resolve => {
        const result = confirm(`Remove "${name}"?`);
        resolve(result);
      })) return;
      
      const items = await GM.getValue(DATA_KEY, []);
      await GM.setValue(DATA_KEY, items.filter(i => i.name !== name));
      displayUI();
    };
  
    const removeAll = async () => {
      if (!await new Promise(resolve => {
        const result = confirm("Delete ALL?");
        resolve(result);
      })) return;
      
      await GM.setValue(DATA_KEY, []);
      displayUI();
    };
  
    const showError = (msg) => {
      const $n = $("#steamTracker_notificationArea");
      if ($n.length) $("<div>").css({ color: "red", marginBottom: "5px" }).text(msg).appendTo($n);
      log.e(msg);
    };
  
    // Add CSS for hover effects
    $("<style>")
      .prop("type", "text/css")
      .html(`
        .st_tabBtn:hover {
          background: #005bb5;
        }
        #st_apply:hover {
          background: #218838;
        }
        #st_close:hover {
          background: #c82333;
        }
        #st_min:hover {
          background: #444;
        }
      `)
      .appendTo("head");
  
    /*--- MAIN UI ---*/
    async function displayUI() {
      const items = await GM.getValue(DATA_KEY, []);
      const byGame = items.reduce((a, v) => {
        const gameName = v.game === "CS2" ? "Counter-Strike 2" : v.game;
        a[gameName] = (a[gameName] || []).concat(v);
        return a;
      }, {});
      const tabs = Object.keys(byGame).concat(["Settings"]);
      
      let $box = $("#steamTracker_box");
      if (!$box.length) {
        $box = $("<div>", { id: "steamTracker_box" }).css({
          position: "fixed",
          top: 10,
          left: 10, // Changed back to left
          backgroundColor: "#1b2838", // Steam's dark blue
          color: "#fff",
          padding: "12px",
          border: "1px solid #2a475e", // Steam's border color
          borderRadius: "4px",
          zIndex: 999999,
          maxHeight: "80vh",
          width: "350px",
          overflowY: "auto",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
          fontSize: "13px"
        }).appendTo("body");
      }

      const tabButtons = tabs.map(tab => `
        <button class="st_tabBtn" data-tab="${tab}" style="
          background: #2a475e;
          color: #fff;
          border: none;
          padding: 6px 12px;
          cursor: pointer;
          border-radius: 2px;
          font-size: 12px;
          transition: background 0.2s;">${tab}</button>`).join("");

      $box.html(`
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="display:flex;gap:4px;">
            ${tabButtons}
          </div>
          <div style="display:flex;gap:4px;">
            <button id="st_min" style="background:#2a475e;color:#fff;border:none;padding:4px 8px;cursor:pointer;border-radius:2px;">_</button>
            <button id="st_close" style="background:#2a475e;color:#fff;border:none;padding:4px 8px;cursor:pointer;border-radius:2px;">×</button>
          </div>
        </div>
        <div id="steamTracker_notificationArea"></div>
        <div id="st_content"></div>
      `);

      // Buttons
      $("#st_close").on("click", () => $box.remove());
      $("#st_min").on("click", () => {
        const $c = $("#st_content"), $f = $("#steamTracker_filterSortRow");
        $c.is(":visible") ? ($c.hide(), $f.hide()) : ($c.show(), $f.show());
      });
      $(".st_tabBtn").on("click", function () {
        $(".st_tabBtn").removeClass("active");
        $(this).addClass("active");
        renderTab($(this).data("tab"), byGame, items);
      });
      $("#st_apply").on("click", function () {
        const $btn = $(".st_tabBtn.active");
        if ($btn.length) renderTab($btn.data("tab"), byGame, items);
      });
      $(".st_tabBtn").first().click();

      $(`
        <div id="st_modal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:999999;">
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#1b2838;padding:20px;border-radius:6px;width:320px;box-shadow:0 0 20px rgba(0,0,0,0.5);">
            <h3 style="margin:0 0 15px;color:#fff;font-size:14px;border-bottom:1px solid #2a475e;padding-bottom:10px;">
              Edit Purchase Price
            </h3>
            <div style="margin-bottom:20px;">
              <input type="text" id="st_modal_price" placeholder="Purchase price (e.g. 12,99 or 12.99)" 
                style="width:100%;padding:8px;background:#2a475e;border:1px solid #4b6b8f;color:#fff;border-radius:3px;font-size:13px;
                transition:all 0.2s;outline:none;"
                onFocus="this.style.borderColor='#66c0f4'"
                onBlur="this.style.borderColor='#4b6b8f'" />
            </div>
            <div style="display:flex;justify-content:flex-end;gap:10px;">
              <button id="st_modal_remove" 
                style="background:#c23;color:#fff;border:none;padding:8px 15px;cursor:pointer;border-radius:3px;
                transition:all 0.2s;font-size:13px;margin-right:auto;">
                Remove Price
              </button>
              <button id="st_modal_cancel" 
                style="background:#2a475e;color:#c8d0d9;border:none;padding:8px 15px;cursor:pointer;border-radius:3px;
                transition:all 0.2s;font-size:13px;">
                Cancel
              </button>
              <button id="st_modal_save" 
                style="background:#588a1b;color:#fff;border:none;padding:8px 15px;cursor:pointer;border-radius:3px;
                transition:all 0.2s;font-size:13px;">
                Save
              </button>
            </div>
          </div>
        </div>
      `).appendTo("body");
    }
  
    /*--- RENDER TABS ---*/
    async function renderTab(tab, itemsByGame, allItems) {
      const $content = $("#st_content");
      if (tab === "Settings") {
        $content.html(buildSettingsUI());
        attachSettings();
        return;
      }

      let items = itemsByGame[tab] || [];
      const hideBelowThreshold = await GM.getValue(HIDE_BELOW_THRESHOLD_KEY, DEFAULT_HIDE_BELOW_THRESHOLD);
      
      let hiddenCount = 0;
      if (hideBelowThreshold) {
        const originalLength = items.length;
        items = items.filter(item => item.profitMargin >= (item.thresholdUsed || 0));
        hiddenCount = originalLength - items.length;
      }

      // Sort by profit margin descending by default
      items.sort((a, b) => b.profitMargin - a.profitMargin);

      let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h3 style="margin:0;color:#fff;font-size:14px;">${tab}</h3>
          <button id="st_delAll" style="background:#c23;color:#fff;border:none;padding:4px 8px;cursor:pointer;border-radius:2px;font-size:12px;">
            Clear All
          </button>
        </div>
      `;

      const personalMode = await GM.getValue(PERSONAL_MODE_KEY, false);
      const analyticsMode = await GM.getValue(ANALYTICS_MODE_KEY, true);

      items.forEach(item => {
        const profitColor = item.profitMargin >= (item.thresholdUsed || 0) ? "#66c0f4" : "#fff";
        
        // Get BUFF price
        const buffElement = document.querySelector('.vertical_markets_container li[data-market="buff163"] .market_price_number');
        const buffPrice = buffElement ? parseFloat(buffElement.textContent) : null;
        
        html += `
        <div style="padding:12px;border:1px solid #2a475e;border-radius:4px;margin-bottom:10px;background:#2a475e;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <a href="${item.url}" target="_blank" 
              style="color:${profitColor};text-decoration:none;font-weight:bold;font-size:13px;">
              ${item.name}
            </a>
            <span class="st_remove" data-name="${item.name}" 
              style="color:#c23;cursor:pointer;opacity:0.7;transition:opacity 0.2s;font-size:16px;">
              ×</span>
          </div>
          ${analyticsMode ? `
            <div style="font-size:12px;color:#acdbf5;">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
                <div>Quicksell: ${item.quicksellPrice.toFixed(2)}€</div>
                <div>Net: ${item.netQuicksellPrice.toFixed(2)}€</div>
                <div>SIH Price: ${item.sihPrice.toFixed(2)}€</div>
                ${buffPrice ? `<div>BUFF: ${buffPrice.toFixed(2)}€</div>` : ''}
                <div style="color:${profitColor};">Profit: ${item.profitMargin.toFixed(2)}%</div>
              </div>
            </div>
          ` : `
            <div style="font-size:13px;color:${profitColor};text-align:center;padding:4px 0;">
              Profit: ${item.profitMargin.toFixed(2)}%
            </div>
          `}
          ${personalMode ? `
            <div style="margin:10px -12px -12px;padding:10px 12px;background:#1b2838;border-top:1px solid #2a475e;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:${item.boughtFor ? '8px' : '0'};">
                ${item.boughtFor ? `
                  <div style="color:#acdbf5;">
                    Bought for: ${item.boughtFor.toFixed(2)}€
                  </div>
                  <button class="st_edit_price" data-name="${item.name}"
                    style="background:#2a475e;color:#fff;border:none;padding:4px 10px;cursor:pointer;border-radius:2px;
                    font-size:11px;transition:all 0.2s;&:hover {background:#3d5f7c;}">
                    Edit
                  </button>
                ` : `
                  <button class="st_edit_price" data-name="${item.name}"
                    style="background:#2a475e;color:#fff;border:none;padding:4px 10px;cursor:pointer;border-radius:2px;
                    font-size:12px;width:100%;transition:all 0.2s;&:hover {background:#3d5f7c;}">
                    Add Purchase Price
                  </button>
                `}
              </div>
              ${item.boughtFor ? `
                <div style="color:${item.personalProfit > 0 ? '#66c0f4' : '#ff7b7b'};font-size:12px;">
                  Personal Profit: ${item.personalProfit.toFixed(2)}€ (${(item.personalProfitPercent || 0).toFixed(2)}%)
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>`;
      });

      // Add hidden items message if any
      if (hiddenCount > 0) {
        html += `
          <div style="margin-top:10px;padding:8px;background:#2a475e;border-radius:3px;text-align:center;color:#acdbf5;font-size:12px;">
            ${hiddenCount} item${hiddenCount !== 1 ? 's' : ''} hidden (below profit threshold)
          </div>
        `;
      }

      $content.html(html);

      // Add handlers for personal mode
      if (personalMode) {
        let currentItem = null;
        
        $(".st_edit_price").on("click", function() {
          const name = $(this).data("name");
          currentItem = items.find(i => i.name === name);
          $("#st_modal_price").val(currentItem?.boughtFor || "");
          $("#st_modal").fadeIn(200);
          $("#st_modal_price").focus();
        });

        $("#st_modal_cancel").on("click", () => {
          $("#st_modal").fadeOut(200);
          currentItem = null;
        });

        $("#st_modal_remove").on("click", async () => {
          if (!currentItem) return;
          
          const items = await GM.getValue(DATA_KEY, []);
          const itemIndex = items.findIndex(i => i.name === currentItem.name);
          if (itemIndex > -1) {
            const item = items[itemIndex];
            delete item.boughtFor;
            delete item.personalProfit;
            delete item.personalProfitPercent;
            items[itemIndex] = item;
            await GM.setValue(DATA_KEY, items);
            $("#st_modal").fadeOut(200);
            currentItem = null;
            
            // Force refresh the UI
            await displayUI();
            // Re-click the active tab to show updated data
            const activeTab = $(".st_tabBtn.active").data("tab");
            if (activeTab) {
              renderTab(activeTab, byGame, items);
            }
          }
        });

        $("#st_modal_save").on("click", async () => {
          if (!currentItem) return;
          
          const priceStr = $("#st_modal_price").val();
          const price = formatPrice(priceStr);
          
          if (isNaN(price)) {
            alert("Please enter a valid price");
            return;
          }

          const items = await GM.getValue(DATA_KEY, []);
          const itemIndex = items.findIndex(i => i.name === currentItem.name);
          if (itemIndex > -1) {
            const item = items[itemIndex];
            if (price <= 0) {
              // Remove price data if zero or negative
              delete item.boughtFor;
              delete item.personalProfit;
              delete item.personalProfitPercent;
            } else {
              // Add/update price data
              item.boughtFor = price;
              item.personalProfit = item.netQuicksellPrice - price;
              item.personalProfitPercent = (item.personalProfit / price) * 100;
            }
            items[itemIndex] = item;
            await GM.setValue(DATA_KEY, items);
            $("#st_modal").fadeOut(200);
            currentItem = null;
            
            // Force refresh the UI
            await displayUI();
            // Re-click the active tab to show updated data
            const activeTab = $(".st_tabBtn.active").data("tab");
            if (activeTab) {
              renderTab(activeTab, byGame, items);
            }
          }
        });

        // Handle Enter key in price input
        $("#st_modal_price").on("keypress", function(e) {
          if (e.which === 13) {
            $("#st_modal_save").click();
          }
        });
      }

      $("#st_delAll").on("click", () => confirm("Delete ALL?") && removeAll());
      $(".st_remove").on("click", function () {
        const name = $(this).data("name");
        confirm(`Remove "${name}"?`) && removeItem(name);
      });
    }
  
    /*--- SETTINGS UI ---*/
    function buildSettingsUI() {
      return `
        <div style="background:#1b2838;padding:15px;border-radius:4px;">
          <div style="margin-bottom:20px;text-align:center;padding-bottom:15px;border-bottom:1px solid #2a475e;">
            <h3 style="margin:0 0 5px;color:#fff;">Steam Market Arbitrage Calculator</h3>
            <div style="font-size:12px;color:#acdbf5;">
              <a href="https://github.com/raitnigol/Steam-Market-Arbitrage-Calculator" 
                 style="color:#66c0f4;text-decoration:none;transition:color 0.2s;" 
                 target="_blank">
                GitHub Repository
              </a>
              •
              <a href="https://nigol.ee" 
                 style="color:#66c0f4;text-decoration:none;transition:color 0.2s;" 
                 target="_blank">
                nigol.ee
              </a>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:15px;">
            <div class="setting-group" style="background:#2a475e;padding:12px;border-radius:3px;">
              <label style="display:block;margin-bottom:8px;">
                <input type="checkbox" id="st_set_personal" />
                <span style="color:#fff;font-weight:bold;">Personal Tracker Mode</span>
              </label>
              <div style="color:#acdbf5;font-size:11px;">
                Track your actual purchase prices and profits.<br>
                Disables auto-purge when enabled.
              </div>
            </div>

            <div class="setting-group" style="background:#2a475e;padding:12px;border-radius:3px;">
              <label style="display:block;margin-bottom:8px;">
                <span style="color:#fff;font-weight:bold;">Purge Interval</span>
                <input type="number" min="1" id="st_set_purge" 
                  style="width:70px;margin-left:8px;padding:3px;background:#1b2838;border:1px solid #4b6b8f;color:#fff;border-radius:2px;" /> hours
              </label>
              <div style="color:#acdbf5;font-size:11px;">
                How often to clear non-personal tracking data
              </div>
            </div>

            <div class="setting-group" style="background:#2a475e;padding:12px;border-radius:3px;">
              <label style="display:block;margin-bottom:8px;">
                <span style="color:#fff;font-weight:bold;">Profit Threshold</span>
                <input type="number" id="st_set_profit" 
                  style="width:70px;margin-left:8px;padding:3px;background:#1b2838;border:1px solid #4b6b8f;color:#fff;border-radius:2px;" /> %
              </label>
              <div style="color:#acdbf5;font-size:11px;">
                Minimum profit percentage to highlight items
              </div>
            </div>

            <div class="setting-group" style="background:#2a475e;padding:12px;border-radius:3px;">
              <label style="display:block;">
                <input type="checkbox" id="st_set_hideBelow" />
                <span style="color:#fff;font-weight:bold;">Hide Items Below Threshold</span>
              </label>
            </div>

            <div class="setting-group" style="background:#2a475e;padding:12px;border-radius:3px;">
              <label style="display:block;margin-bottom:8px;">
                <input type="checkbox" id="st_set_analytics" />
                <span style="color:#fff;font-weight:bold;">Analytics Mode</span>
              </label>
              <div style="color:#acdbf5;font-size:11px;">
                Show detailed market data including BUFF prices
              </div>
            </div>
          </div>

          <button id="st_save" style="
            width:100%;
            margin-top:15px;
            background:#588a1b;
            color:#fff;
            padding:8px;
            border:none;
            border-radius:3px;
            cursor:pointer;
            font-weight:bold;
            transition:background 0.2s;">
            Save Settings
          </button>
        </div>
      `;
    }
  
    async function attachSettings() {
      const [curInt, curPT, hideBelow, personalMode, analyticsMode] = await Promise.all([
        GM.getValue(RESET_INTERVAL_KEY, DEFAULT_RESET_INTERVAL),
        GM.getValue(PROFIT_THRESHOLD_KEY, DEFAULT_PROFIT_THRESH),
        GM.getValue(HIDE_BELOW_THRESHOLD_KEY, DEFAULT_HIDE_BELOW_THRESHOLD),
        GM.getValue(PERSONAL_MODE_KEY, false),
        GM.getValue(ANALYTICS_MODE_KEY, true)
      ]);
  
      $("#st_set_purge").val(curInt / 3600000 || 6);
      $("#st_set_profit").val(curPT);
      $("#st_set_hideBelow").prop("checked", !!hideBelow);
      $("#st_set_personal").prop("checked", !!personalMode);
      $("#st_set_analytics").prop("checked", !!analyticsMode);
  
      // Disable purge interval if personal mode is on
      const togglePurgeInput = (isPersonal) => {
        $("#st_set_purge").prop("disabled", isPersonal)
          .css("opacity", isPersonal ? 0.5 : 1);
      };
      
      togglePurgeInput(personalMode);
      $("#st_set_personal").on("change", function() {
        togglePurgeInput(this.checked);
      });
  
      $("#st_save").on("click", async () => {
        const h = parseFloat($("#st_set_purge").val()),
              p = parseFloat($("#st_set_profit").val()),
              hb = $("#st_set_hideBelow").is(":checked"),
              pm = $("#st_set_personal").is(":checked"),
              am = $("#st_set_analytics").is(":checked");
  
        if (!pm && (isNaN(h) || h < 1)) {
          showNotification("Purge interval must be ≥1 hour", 'error');
          return;
        }
        if (isNaN(p)) {
          showNotification("Profit threshold must be a number", 'error');
          return;
        }
  
        await Promise.all([
          GM.setValue(RESET_INTERVAL_KEY, h * 3600000),
          GM.setValue(PROFIT_THRESHOLD_KEY, p),
          GM.setValue(HIDE_BELOW_THRESHOLD_KEY, hb),
          GM.setValue(PERSONAL_MODE_KEY, pm),
          GM.setValue(ANALYTICS_MODE_KEY, am)
        ]);
  
        showNotification("Settings saved successfully!");
      });
    }
  
    /*--- MAIN ---*/
    async function main() {
      log.i("Script start (Condensed + jQuery).");
      await resetIfNeeded();
      try {
        // First get non-SIH elements
        const [$n, $qs] = await Promise.all([
          waitForElement(".market_listing_item_name"),
          waitForElement("#market_commodity_buyrequests .market_commodity_orders_header_promote:nth-child(2)")
        ]);

        // Try multiple SIH selectors
        const sihSelectors = [
          "#sih_block_best_offer_of_marketplace_tabs_2 .sih_market__price",
          ".sih_market__price",
          "[id^='sih_block_best_offer'] .sih_market__price",
          ".sih_market_price",
          "#sih_block_best_offer_of_marketplace_tabs_2 span"
        ];

        let $sih = null;
        for (const selector of sihSelectors) {
          try {
            $sih = await waitForElement(selector, 2000, true);
            if ($sih) {
              log.i(`Found SIH element with selector: ${selector}`);
              break;
            }
          } catch (e) {
            log.d(`Selector failed: ${selector}`);
          }
        }

        if (!$sih) {
          throw new Error("SIH not loaded or not installed. Please ensure Steam Inventory Helper is installed and enabled.");
        }

        const name = $n.text().trim(),
              url = location.href,
              game = detectGame(),
              { appId } = parseItemIdFromUrl(),
              qPrice = parseFloat($qs.text().trim().replace(/[^0-9.,-]/g, '').replace(',', '.')),
              sPrice = parseFloat($sih.text().trim().replace(/[^0-9.,-]/g, '').replace(',', '.'));

        if (isNaN(qPrice) || isNaN(sPrice)) throw new Error("Invalid price data.");

        const { net, net15, rate } = calcFee(qPrice),
              diff = net - sPrice,
              pm = (diff / sPrice) * 100,
              thr = await GM.getValue(PROFIT_THRESHOLD_KEY, DEFAULT_PROFIT_THRESH);

        const newItem = {
          name,
          url,
          appId,
          quicksellPrice: qPrice,
          sihPrice: sPrice,
          netQuicksellPrice: net,
          netQuicksellPrice15: net15,
          diff,
          profitMargin: pm,
          feeRateUsed: rate,
          game,
          thresholdUsed: thr
        };

        await addOrUpdateItem(newItem);

        if (pm >= thr && thr > 0) {
          GM.notification({
            text: `High-profit item: ${name} (${pm.toFixed(2)}% profit)`,
            title: "Steam Market Arbitrage",
            timeout: 5000
          });
        }
        displayUI();
      } catch (e) {
        if (e.message.includes("SIH not loaded")) {
          showError("Steam Inventory Helper is required for this script. Please install/enable SIH and refresh the page.");
        } else {
          showError("Error: " + e.message);
        }
        log.e(e);
      }
    }
  
    // Add this function near other UI helper functions
    const showNotification = (message, type = 'success') => {
      const colors = {
        success: { bg: '#588a1b', text: '#fff' },
        error: { bg: '#c23', text: '#fff' }
      };
      const style = colors[type] || colors.success;
      
      // Remove any existing notification
      $("#st_notification").remove();
      
      $(`
        <div id="st_notification" style="
          position: absolute;
          top: 15px;
          left: 50%;
          transform: translateX(-50%);
          background: ${style.bg};
          color: ${style.text};
          padding: 8px 16px;
          border-radius: 3px;
          font-size: 13px;
          opacity: 0;
          transition: opacity 0.3s;">
          ${message}
        </div>
      `).appendTo("#st_content");

      // Fade in
      setTimeout(() => $("#st_notification").css('opacity', 1), 10);
      
      // Fade out and remove
      setTimeout(() => {
        const $notif = $("#st_notification");
        $notif.css('opacity', 0);
        setTimeout(() => $notif.remove(), 300);
      }, 2000);
    };
  
    main();
  })();