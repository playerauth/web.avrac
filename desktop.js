// home.js - ULTRA FAST VERSION (parallel loading, no cache, original design preserved)

// ----- IMMEDIATE SPINNER -----
(function showInitialSpinner() {
  const container = document.getElementById("desktop-feed-container") 
               || document.getElementById("feed-container");
    if (!container) {
    setTimeout(showInitialSpinner, 10);
    return;
  }
  if (!document.getElementById('initial-loader')) {
    const spinner = document.createElement('div');
    spinner.id = 'initial-loader';
    spinner.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
      background: white;
      border-radius: 12px;
      margin: 40px auto;
      max-width: 400px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      position: relative;
      z-index: 1000;
    `;
    spinner.innerHTML = `
      <div style="border: 6px solid #f3f3f3; border-top: 6px solid #0066cc; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
      <div style="font-size: 1.2rem; color: #333; font-weight: 500;">Loading news feeds...</div>
      <div style="font-size: 0.9rem; color: #666; margin-top: 10px;">This may take a few seconds</div>
      <style>
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    `;
    container.appendChild(spinner);
  }
})();

async function loadFeeds() {
  const container = document.getElementById("feed-container");
  if (!container) return console.error("Container missing");

  // Preserve spinner during clear
  const existingSpinner = document.getElementById('initial-loader');
  
  // Clear container
  container.innerHTML = "";

  // Reappend spinner if exists
  if (existingSpinner) {
    container.appendChild(existingSpinner);
  }

  // ----- 1. CREATE ALL CATEGORY SECTIONS (empty) -----
  const grouped = {};
  feeds.forEach(f => (grouped[f.category] = grouped[f.category] || []).push(f));

  const categoryDivs = {};
  for (const [category, sources] of Object.entries(grouped)) {
    const section = document.createElement("div");
    section.className = "category";
    section.innerHTML = `<div class="feed" data-category="${category}"></div>`;
    container.appendChild(section);
    categoryDivs[category] = section.querySelector(".feed");
  }

  // ----- 2. CREATE LOADING INDICATOR (will move down) -----
  const loadingDiv = document.createElement("div");
  loadingDiv.id = "feed-loading";
  loadingDiv.style.cssText = `
    margin: 30px 0;
  margin-bottom: 60px;
    padding: 20px;
    text-align: center;
    display: none;
    background: #f0f7ff;
    border: 1px dashed #0066cc;
    border-radius: 8px;
    color: #0066cc;
    font-weight: 600;
    transition: all 0.3s;
  `;
  loadingDiv.innerHTML = `Initializing feeds...`;
  container.appendChild(loadingDiv);

  // ----- 3. FAST PROXIES ONLY (3 fastest) -----
  const PROXIES = [
    url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
  ];

  // ----- 4. FETCH WITH TIMEOUT (4 seconds) -----
  const fetchWithTimeout = async (url, timeout = 4000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      return res;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  };

  let firstFeedDisplayed = false;
  let completedFeeds = 0;

  // ----- 5. PARALLEL BATCH LOADING (5 at a time) -----
  const BATCH_SIZE = 5;
  const totalBatches = Math.ceil(feeds.length / BATCH_SIZE);
  
  for (let batchIndex = 0; batchIndex < feeds.length; batchIndex += BATCH_SIZE) {
    const batch = feeds.slice(batchIndex, batchIndex + BATCH_SIZE);
    const currentBatch = Math.floor(batchIndex / BATCH_SIZE) + 1;
    
    // Update loading text
    loadingDiv.innerHTML = `Loading batch ${currentBatch}/${totalBatches} (${completedFeeds}/${feeds.length} feeds)...`;
    container.appendChild(loadingDiv);

    // Process batch in parallel
    await Promise.all(batch.map(async (source) => {
      const feedDiv = categoryDivs[source.category];
      if (!feedDiv) return;

      let success = false;
      let itemsToShow = [];
      

      // Try proxies in order until one works
      for (const proxyFn of PROXIES) {
        if (success) break;
        try {
          const proxyUrl = proxyFn(source.url);
          const res = await fetchWithTimeout(proxyUrl, 4000);
          
          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const xmlText = await res.text();
          const parser = new DOMParser();
          const xml = parser.parseFromString(xmlText, "text/xml");

          // Get all RSS/Atom items
          let items = Array.from(xml.querySelectorAll("item, entry"));
          if (!items.length) items = Array.from(xml.querySelectorAll("item"));

          if (items.length === 0) throw new Error("No items");

          // Show only 2 items per feed for speed (was 3)
          const max = Math.min(items.length, 2);
          for (let i = 0; i < max; i++) {
            const item = items[i];
            const article = {};

            // Title
            let titleEl = item.querySelector("title");
            article.title = titleEl?.textContent?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() || "No title";
            if (article.title.length > 70) article.title = article.title.slice(0, 70) + "…";

            // Link
            article.link = item.querySelector("link")?.textContent || item.querySelector("link")?.getAttribute("href") || "#";

            // Date
            let dateStr = item.querySelector("pubDate, dc\\:date, published")?.textContent || "";
            article.date = "Recent";
            if (dateStr) {
              try {
                const d = new Date(dateStr);
                article.date = d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              } catch (e) {}
            }

            // Image - Fast extraction (no regex on description)
            article.img = null;
            const enc = item.querySelector("enclosure");
            if (enc?.getAttribute("type")?.startsWith("image/")) article.img = enc.getAttribute("url");
            if (!article.img) {
              const media = item.querySelector("media\\:content, media\\:thumbnail");
              if (media?.getAttribute("url")) article.img = media.getAttribute("url");
            }
            if (!article.img) article.img = source.customImage || "https://raw.githubusercontent.com/playerauth/media-assets/refs/heads/main/news.jpg";

            itemsToShow.push(article);
          }
          success = true;
        } catch (err) {
          // Silently fail - will show placeholder
        }
      }

      // Append articles (use setTimeout to avoid blocking)
      setTimeout(() => {
        if (itemsToShow.length > 0) {
          itemsToShow.forEach(article => {
            const itemDiv = document.createElement("div");
            itemDiv.className = "item";
            itemDiv.innerHTML = `
              <img src="${article.img}" alt="thumbnail" loading="lazy"
                   onerror="this.onerror=null; this.src='https://placehold.co/600x400?text=News';">
              <div>
                <a href="${article.link}" target="_blank" rel="noopener">${article.title}</a>
                <p>${article.date}</p>
                <p style="margin-top:6px; font-size:0.8rem; color:#0066cc; font-weight:600;">
                  Source: <a href="${source.sourceLink}" target="_blank" style="color:#0066cc; margin-bottom: 10px !important;">${source.sourceName}</a>
                </p>
              </div>
            `;
            feedDiv.appendChild(itemDiv);
          });
        } else {
          // Placeholder for failed feed
          const errorDiv = document.createElement("div");
          errorDiv.className = "item";
          errorDiv.innerHTML = `
            <img src="https://raw.githubusercontent.com/playerauth/media-assets/refs/heads/main/private.jpg" style="opacity:0.8;">
            <div>
              <p style="color:#007bff; font-weight:600;">${source.sourceName}</p>
              <p style="font-size:0.8rem; color:red; font-weight: 900;">Secured News. If you want to see visit source.</p>
              <p style="margin-top:6px; font-size:0.75rem;">
                <a href="${source.sourceLink}" target="_blank" style="color:#0066cc; margin-bottom: 10px; !important">Visit source →</a>
              </p>
            </div>
          `;
          feedDiv.appendChild(errorDiv);
        }

        // Remove initial spinner after first feed content appears
        if (!firstFeedDisplayed) {
          const spinner = document.getElementById('initial-loader');
          if (spinner) {
            spinner.remove();
          }
          firstFeedDisplayed = true;
        }

        // Move loading indicator below this feed's content
        const lastChild = feedDiv.lastElementChild;
        if (lastChild) {
          lastChild.insertAdjacentElement("afterend", loadingDiv);
        }
        
        completedFeeds++;
      }, 0);
    }));

    // Small delay between batches to prevent overwhelming
    await new Promise(r => setTimeout(r, 50));
  }

  // Wait for all setTimeout callbacks to complete
  setTimeout(() => {
    // ----- ALL FEEDS LOADED -----
    loadingDiv.innerHTML = `All ${feeds.length} feeds loaded. Last updated: ${new Date().toLocaleTimeString()}`;
    loadingDiv.style.background = "#e6f7e6";
    loadingDiv.style.borderColor = "#28a745";
    loadingDiv.style.color = "#28a745";
  }, 500);
}

// ----- START WHEN DOM READY -----
document.addEventListener("DOMContentLoaded", () => {
  if (typeof feeds !== "undefined") {
    loadFeeds();
  } else {
    console.error("news.js not loaded");
    const container = document.getElementById("feed-container");
    if (container) {
      container.innerHTML = '<div style="color:red; padding:40px; text-align:center;">No latest news found</div>';
    }
  }
});

// ----- AUTO-REFRESH EVERY 30 MINUTES -----
setInterval(() => {
  console.log("Auto-refreshing feeds...");
  loadFeeds();
}, 30 * 60 * 1000);


