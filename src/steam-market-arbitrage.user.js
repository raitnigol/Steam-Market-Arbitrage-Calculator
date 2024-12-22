// ==UserScript==
// @name         Steam Market Arbitrage Calculator (SIH)
// @namespace    https://github.com/raitnigol/Steam-Market-Arbitrage-Calculator
// @version      1.0.1
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
  const DATA_KEY               = "steamListingTracker_DATA",
        LAST_RESET_TIME_KEY    = "steamListingTracker_LAST_RESET_TIME",
        RESET_INTERVAL_KEY     = "steamListingTracker_RESET_INTERVAL",
        PROFIT_THRESHOLD_KEY   = "steamListingTracker_PROFIT_THRESHOLD",
        DEFAULT_RESET_INTERVAL = 6 * 3600000,   // 6 hours
        DEFAULT_PROFIT_THRESH  = 0,
        REQUEST_DELAY          = 5000,
        MAX_RETRIES            = 5,
        MAX_BACKOFF            = 30000,
        CACHE_EXPIRATION       = 30 * 60000,
        DEBUG_LOGGING          = true,
        STEAM_DECK_PRICE       = 569,
        VR_KIT_PRICE           = 1079;

  let lastRequestTime = 0,
      cache           = {},
      currentPageUrl  = location.href;

  /*--- LOG WRAPPERS ---*/
  const log = {
    d: (...a) => DEBUG_LOGGING && console.debug("[SteamTracker]", ...a),
    i: (...a) => console.info("[SteamTracker]", ...a),
    w: (...a) => console.warn("[SteamTracker]", ...a),
    e: (...a) => console.error("[SteamTracker]", ...a)
  };

  /*--- HELPER: WAIT FOR ELEM (jQuery) ---*/
  const waitForElement = async (sel, t = 10000) => {
    for (let i=0; i<(t/100); i++) {
      let $el = $(sel);
      if ($el.length) return $el.first();
      await new Promise(r => setTimeout(r, 100));
    }
    throw new Error(`Element not found: ${sel}`);
  };

  /*--- PAGE / URL / GAME DETECTION ---*/
  const parseItemIdFromUrl = () => {
    let m = location.pathname.match(/\/market\/listings\/(\d+)\/(.+)/);
    return m ? {appId:m[1], itemNameEncoded:m[2]} : {appId:null,itemNameEncoded:null};
  };
  const detectGame = () => {
    let $g = $("#largeiteminfo_game_name");
    return $g.length ? $g.text().trim() : "default";
  };
  const isPageChanged = () => location.href !== currentPageUrl;

  /*--- FEE CALC ---*/
  const calcFee = (buyerPays) => {
    let rate = (buyerPays <= 1.0) ? (0.20 - buyerPays*0.08) : 0.13;
    rate = Math.max(0.12, Math.min(rate, 0.20));
    let net = buyerPays*(1-rate), net15 = buyerPays*0.85;
    return {
      net:  Math.floor(net*100)/100,
      net15:Math.floor(net15*100)/100,
      rate
    };
  };

  /*--- RESET IF NEEDED ---*/
  const resetIfNeeded = async () => {
    let lr  = await GM.getValue(LAST_RESET_TIME_KEY, null),
        now = Date.now(),
        int = await GM.getValue(RESET_INTERVAL_KEY, DEFAULT_RESET_INTERVAL);
    if (!lr || (now - new Date(lr).getTime() > int)) {
      log.i("Reset DB (interval).");
      await GM.setValue(DATA_KEY, []);
      await GM.setValue(LAST_RESET_TIME_KEY, new Date().toISOString());
    }
  };

  /*--- FETCH w/ RETRIES ---*/
  const fetchRetry = async (url) => {
    let delay=1000;
    for (let i=0; i<MAX_RETRIES; i++) {
      if (isPageChanged()) { log.i("Page changed, stop fetch."); return null; }
      let dms = Date.now() - lastRequestTime;
      if (dms < REQUEST_DELAY) await new Promise(r=>setTimeout(r,REQUEST_DELAY-dms));
      lastRequestTime=Date.now();
      try {
        let res=await fetch(url);
        if (res.ok) { delay=1000; return res.json(); }
        if (res.status===429) {
          log.w(`429, retry in ${delay}ms (attempt ${i+1}).`);
          await new Promise(r=>setTimeout(r,delay));
          delay=Math.min(delay*2,MAX_BACKOFF);
        } else throw new Error(`HTTP error: ${res.status}`);
      } catch(e){ log.e(`Fetch attempt ${i+1} fail`, e); }
    }
    log.e("All fetch attempts fail:", url);
    return null;
  };

  /*--- GET / SET DATA ---*/
  const getCachedData = async (id) => {
    if (cache[id] && (Date.now()-cache[id].ts < CACHE_EXPIRATION)) return cache[id].data;
    let data=await fetchRetry(`https://steamcommunity.com/market/itemordersactivity?item_nameid=${id}`);
    if (data) cache[id]={data, ts:Date.now()};
    return data;
  };
  const addOrUpdateItem = async (item) => {
    let items = await GM.getValue(DATA_KEY, []);
    let ix = items.findIndex(it=>it.name===item.name);
    (ix>-1) ? items[ix]=item : items.push(item);
    await GM.setValue(DATA_KEY, items);
  };

  /*--- UI / DB OPS ---*/
  const removeItem = async (name) => {
    let items = await GM.getValue(DATA_KEY, []);
    items = items.filter(i=>i.name!==name);
    await GM.setValue(DATA_KEY, items);
    displayUI();
  };
  const removeAll = async () => { await GM.setValue(DATA_KEY,[]); displayUI(); };

  const showError = (msg) => {
    let $n=$("#steamTracker_notificationArea");
    if($n.length) $("<div>").css({color:"red",marginBottom:"5px"}).text(msg).appendTo($n);
    log.e(msg);
  };

  /*--- MAIN UI ---*/
  async function displayUI(){
    let items=await GM.getValue(DATA_KEY,[]),
        byGame=items.reduce((a,v)=>(a[v.game]=(a[v.game]||[]).concat(v),a),{});
    let tabs=Object.keys(byGame).concat(["Stats & Goals","Settings"]),
        $box=$("#steamTracker_box");
    if(!$box.length){
      $box=$("<div>",{id:"steamTracker_box"}).css({
        position:"fixed",top:10,left:10,bgcolor:"#2c2c2c",color:"#f9f9f9",
        padding:15,border:"1px solid #444",borderRadius:8,zIndex:999999,
        maxHeight:500,overflowY:"auto",boxShadow:"0 4px 8px rgba(0,0,0,0.7)",
        fontFamily:"Arial,sans-serif",fontSize:"13px",background:"#2c2c2c"
      }).appendTo("body");
    }
    let tabButtons = tabs.map(tab=>`
      <button class="st_tabBtn" data-tab="${tab}" style="
        background:#0073e6;color:#fff;border:none;padding:5px 10px;cursor:pointer;
        border-radius:4px;font-size:12px;">${tab}</button>`).join("");
    $box.html(`
      <div style="display:flex;gap:5px;margin-bottom:10px;">
        <button id="st_close" style="background:#d33;color:#fff;border:none;padding:5px 8px;cursor:pointer;border-radius:4px;">X</button>
        <button id="st_min" style="background:#555;color:#fff;border:none;padding:5px 8px;cursor:pointer;border-radius:4px;">-</button>
        ${tabButtons}
      </div>
      <div id="steamTracker_filterSortRow" style="margin-bottom:10px;">
        <input id="st_filter" placeholder="Filter by name..." style="padding:3px;width:120px;"/>
        <select id="st_sort" style="padding:3px;">
          <option value="nameAsc">Name (A→Z)</option>
          <option value="nameDesc">Name (Z→A)</option>
          <option value="profitAsc">Profit (Asc)</option>
          <option value="profitDesc" selected>Profit (Desc)</option>
        </select>
        <button id="st_apply" style="background:#28a745;color:#fff;border:none;padding:5px 8px;cursor:pointer;border-radius:4px;">Apply</button>
      </div>
      <div id="steamTracker_notificationArea" style="margin-bottom:5px;"></div>
      <div id="st_content" style="margin-top:10px;"></div>
    `);

    // Buttons
    $("#st_close").on("click", ()=>$box.remove());
    $("#st_min").on("click", ()=>{
      let $c=$("#st_content"),$f=$("#steamTracker_filterSortRow");
      $c.is(":visible")?($c.hide(),$f.hide()):($c.show(),$f.show());
    });
    $(".st_tabBtn").on("click",function(){
      $(".st_tabBtn").removeClass("active");
      $(this).addClass("active");
      renderTab($(this).data("tab"), byGame, items);
    });
    $("#st_apply").on("click",function(){
      let $btn=$(".st_tabBtn.active");
      if($btn.length) renderTab($btn.data("tab"), byGame, items);
    });
    $(".st_tabBtn").first().click();
  }

  /*--- RENDER TABS ---*/
  function renderTab(tab, byGame, allItems){
    let $c=$("#st_content");
    if(tab==="Settings"){ $c.html(buildSettingsUI()); attachSettings(); return; }
    if(tab==="Stats & Goals"){ $c.html(buildStats(allItems)); return; }
    let arr=byGame[tab]||[], f=($("#st_filter").val()||"").toLowerCase(), s=$("#st_sort").val()||"profitDesc";
    arr=arr.filter(i=>i.name.toLowerCase().includes(f));
    switch(s){
      case "nameAsc": arr.sort((a,b)=>a.name.localeCompare(b.name)); break;
      case "nameDesc":arr.sort((a,b)=>b.name.localeCompare(a.name)); break;
      case "profitAsc":arr.sort((a,b)=>a.profitMargin-b.profitMargin); break;
      default: arr.sort((a,b)=>b.profitMargin-a.profitMargin);
    }
    let html=`<button id="st_delAll" style="background:#d33;color:#fff;border:none;padding:4px 6px;cursor:pointer;border-radius:4px;margin-bottom:10px;">Delete All Items</button>`;
    arr.forEach((it,ix)=>{
      let c= it.profitMargin>=(it.thresholdUsed||0)?"lightgreen":"white";
      html+=`
      <div style="padding:5px 10px;border-bottom:1px solid #555;color:${c};display:flex;justify-content:space-between;">
        <div>
          ${ix+1}. <a href="${it.url}" target="_blank" style="color:#4da6ff;text-decoration:none;">${it.name}</a>
          (AppID:${it.appId||"?"})
          <br/>
          <small>Buyer Quicksell: ${it.quicksellPrice.toFixed(2)}€ => Net: ${it.netQuicksellPrice.toFixed(2)}€ (fee:${Math.round(it.feeRateUsed*100)}%)</small><br/>
          <small>SIH: ${it.sihPrice.toFixed(2)}€ | Profit: ${it.profitMargin.toFixed(2)}% (${it.diff.toFixed(2)}€)</small><br/>
          <small style="color:#aaa;">[15% ref: ${it.netQuicksellPrice15.toFixed(2)}€]</small>
        </div>
        <span class="st_remove" data-name="${it.name}" style="color:#d33;cursor:pointer;font-weight:bold;">✖</span>
      </div>`;
    });
    $c.html(html);
    $("#st_delAll").on("click",()=> confirm("Delete ALL?") && removeAll());
    $(".st_remove").on("click", function(){ let n=$(this).data("name"); confirm(`Remove "${n}"?`) && removeItem(n);});
  }

  /*--- SETTINGS UI ---*/
  function buildSettingsUI(){ return `
    <h3 style="margin-top:0;">Settings</h3>
    <label style="display:block;margin-bottom:8px;">Purge Interval (hours):
      <input type="number" min="1" id="st_set_purge" style="width:60px;" />
    </label>
    <label style="display:block;margin-bottom:8px;">Profit Threshold (%):
      <input type="number" id="st_set_profit" style="width:60px;" />
    </label>
    <button id="st_save" style="background:#28a745;color:#fff;padding:5px 10px;border:none;border-radius:4px;cursor:pointer;">Save Settings</button>
  `;}
  async function attachSettings(){
    let [curInt, curPT] = await Promise.all([
      GM.getValue(RESET_INTERVAL_KEY, DEFAULT_RESET_INTERVAL),
      GM.getValue(PROFIT_THRESHOLD_KEY, DEFAULT_PROFIT_THRESH)
    ]);
    $("#st_set_purge").val(curInt/3600000 || 6);
    $("#st_set_profit").val(curPT);
    $("#st_save").on("click", async()=>{
      let h=parseFloat($("#st_set_purge").val()), p=parseFloat($("#st_set_profit").val());
      if(isNaN(h)||h<1) return alert("Purge interval must be >=1 hour.");
      if(isNaN(p))       return alert("Profit threshold must be a number.");
      await GM.setValue(RESET_INTERVAL_KEY,h*3600000);
      await GM.setValue(PROFIT_THRESHOLD_KEY,p);
      alert("Settings saved!");
    });
  }

  /*--- STATS & GOALS UI ---*/
  function buildStats(arr){
    if(!arr||!arr.length) return `<p>No items tracked yet.</p>`;
    let total=arr.length, hi=arr.reduce((m,i)=>i.profitMargin>m.profitMargin?i:m,arr[0]);
    if(!hi) return `<h3 style="margin-top:0;">Stats & Goals</h3><p><b>Total items tracked:</b> ${total}</p><p>No high-profit item.</p>`;
    let deckCount=Math.ceil(STEAM_DECK_PRICE/hi.netQuicksellPrice),
        deckCost =(deckCount*hi.sihPrice).toFixed(2),
        vrCount =Math.ceil(VR_KIT_PRICE/hi.netQuicksellPrice),
        vrCost  =(vrCount*hi.sihPrice).toFixed(2);
    return `
      <h3 style="margin-top:0;">Stats & Goals</h3>
      <div style="margin-bottom:8px;"><b>Total items tracked:</b> ${total}</div>
      <div style="margin-bottom:8px;">
        <b>Highest Profit Item:</b>
        <span style="color:lightgreen;font-weight:bold;">${hi.name} (${hi.profitMargin.toFixed(2)}%)</span>
      </div>
      <hr/>
      <div style="margin-bottom:8px;">
        <b>Steam Deck (569€):</b>
        <p style="margin:4px 0;">Buy <em>${deckCount}</em> × <em>${hi.sihPrice.toFixed(2)}€</em> = <em>${deckCost}€</em> real money to net ~569€.</p>
      </div>
      <div style="margin-bottom:8px;">
        <b>Valve Index VR Kit (1079€):</b>
        <p style="margin:4px 0;">Buy <em>${vrCount}</em> × <em>${hi.sihPrice.toFixed(2)}€</em> = <em>${vrCost}€</em> real money to net ~1079€.</p>
      </div>
    `;
  }

  /*--- MAIN ---*/
  async function main(){
    log.i("Script start (Condensed + jQuery).");
    await resetIfNeeded();
    try{
      let $n=await waitForElement(".market_listing_item_name"),
          name=$n.text().trim(),
          url=location.href,
          game=detectGame(),
          {appId}=parseItemIdFromUrl(),
          $qs=await waitForElement("#market_commodity_buyrequests .market_commodity_orders_header_promote:nth-child(2)"),
          qPrice=parseFloat($qs.text().trim().replace(/[^0-9.,-]/g,'').replace(',','.')),
          $sih=await waitForElement("#sih_block_best_offer_of_marketplace_tabs_2 .sih_market__price"),
          sPrice=parseFloat($sih.text().trim().replace(/[^0-9.,-]/g,'').replace(',','.'));
      if(isNaN(qPrice)||isNaN(sPrice)) throw new Error("Invalid price data.");
      let {net,net15,rate}=calcFee(qPrice), diff=net-sPrice, pm=(diff/sPrice)*100,
          thr=await GM.getValue(PROFIT_THRESHOLD_KEY,DEFAULT_PROFIT_THRESH),
          newItem={name,url,appId,quicksellPrice:qPrice,sihPrice:sPrice,netQuicksellPrice:net,netQuicksellPrice15:net15,diff,profitMargin:pm,feeRateUsed:rate,game,thresholdUsed:thr};
      await addOrUpdateItem(newItem);
      if(pm>=thr&&thr>0){
        GM.notification({
          text:`High-profit item: ${name} (${pm.toFixed(2)}% profit)`,
          title:"Steam Market Arbitrage",
          timeout:5000
        });
      }
      displayUI();
    } catch(e){ showError("Error: "+e.message); log.e(e); }
  }
  main();
})();
