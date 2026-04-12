const FALLBACK_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 OPR/120.0.0.0";
const UA_API = "https://jnrbsn.github.io/user-agents/user-agents.json";
const CACHE_TTL = 24 * 60 * 60 * 1000;
const ICON_SIZE = 128;
const NETFLIX_URLS = ["*://*.netflix.com/*", "*://assets.nflxext.com/*"];

let activeUA = FALLBACK_UA;
let enabled = true;

// UA
function buildOperaUA(list) {
  const base = list.find(ua => ua.includes("X11; Linux x86_64") && ua.includes("Chrome/") && !ua.includes("Mobile")) ?? "";
  const chrome = base.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/)?.[1] ?? "135.0.0.0";
  const webkit = base.match(/AppleWebKit\/(\d+\.\d+)/)?.[1] ?? "537.36";
  return `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/${webkit} (KHTML, like Gecko) Chrome/${chrome} Safari/${webkit} OPR/${parseInt(chrome) - 15}.0.0.0`;
}

async function refreshUA() {
  const now = Date.now();
  const { cachedUA, cachedUATimestamp } = await chrome.storage.local.get(["cachedUA", "cachedUATimestamp"]);
  if (cachedUA && (now - cachedUATimestamp) < CACHE_TTL) return void (activeUA = cachedUA);
  try {
    const data = await fetch(UA_API).then(r => { if (!r.ok) throw r; return r.json(); });
    activeUA = buildOperaUA(data);
    console.log("[Netflix 1080p UA] Fetched fresh UA:", activeUA);
    await chrome.storage.local.set({ cachedUA: activeUA, cachedUATimestamp: now });
    
    // Update DNR rule with new UA
    if (enabled) {
      await updateDNRRule(activeUA);
    }
  } catch (e) {
    console.error("[Netflix 1080p UA] Failed to fetch UA, using fallback:", e);
    activeUA = cachedUA ?? FALLBACK_UA;
    
    // Update DNR rule with fallback/cached UA
    if (enabled) {
      await updateDNRRule(activeUA);
    }
  }
}

// Update DNR rule with current UA
async function updateDNRRule(ua) {
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [1],
      addRules: [
        {
          id: 1,
          priority: 1,
          action: {
            type: "modifyHeaders",
            requestHeaders: [
              {
                header: "User-Agent",
                operation: "set",
                value: ua
              }
            ]
          },
          condition: {
            urlFilter: "|*",
            resourceTypes: ["xmlhttprequest", "main_frame"],
            initiatorDomains: ["netflix.com"]
          }
        }
      ]
    });
    console.log("[Netflix 1080p UA] DNR rule updated with new UA");
  } catch (e) {
    console.error("[Netflix 1080p UA] Failed to update DNR rule:", e);
  }
}

// icon
function drawIcon(on) {
  const canvas = new OffscreenCanvas(ICON_SIZE, ICON_SIZE);
  const ctx = canvas.getContext("2d");
  const mid = ICON_SIZE / 2;
  ctx.beginPath();
  ctx.arc(mid, mid, mid, 0, Math.PI * 2);
  ctx.fillStyle = on ? "#e50914" : "#555";
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = `bold ${ICON_SIZE * 0.72}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("N", mid, mid + ICON_SIZE * 0.04);
  return ctx.getImageData(0, 0, ICON_SIZE, ICON_SIZE);
}

const updateIcon = (on) => chrome.action.setIcon({ imageData: drawIcon(on) });

// state
async function setEnabled(value) {
  enabled = value;
  await chrome.storage.local.set({ enabled });
  updateIcon(enabled);
  
  // Update DNR rule based on enabled state
  if (enabled) {
    await updateDNRRule(activeUA);
  } else {
    try {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1]
      });
    } catch (e) {
      console.error("[Netflix 1080p UA] Failed to disable DNR rule:", e);
    }
  }
  
  // Notify all Netflix tabs of the change
  const tabs = await chrome.tabs.query({ url: "*://*.netflix.com/*" });
  for (const tab of tabs) {
    chrome.tabs.sendMessage(tab.id, { type: "UPDATE_UA", enabled, ua: activeUA }).catch(() => {});
  }
}

// messages
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SET_ENABLED") {
    return setEnabled(msg.value).then(() => ({ ok: true, ua: activeUA }));
  }
  if (msg.type === "GET_STATE") return Promise.resolve({ enabled, ua: activeUA });
});

// init
async function init() {
  // First, load cached UA synchronously for immediate use
  const { enabled: saved, cachedUA } = await chrome.storage.local.get(["enabled", "cachedUA"]);
  
  // Set activeUA to cached value immediately before any network requests happen
  if (cachedUA) {
    activeUA = cachedUA;
  }
  
  await setEnabled(saved ?? true);
  
  // Then refresh/verify the UA in the background
  await refreshUA();
  updateIcon(enabled);
  
  // Ensure DNR rule is set with current UA
  if (enabled) {
    await updateDNRRule(activeUA);
  }
}

// Ensure UA is fresh when extension starts
init();

// Refresh UA periodically, but also ensure it's available quickly
const refreshInterval = setInterval(refreshUA, CACHE_TTL);

// Also refresh UA when extension loses and regains focus (in case cache expired)
chrome.tabs.onActivated.addListener(async () => {
  const { cachedUATimestamp } = await chrome.storage.local.get("cachedUATimestamp");
  const now = Date.now();
  if (!cachedUATimestamp || (now - cachedUATimestamp) > CACHE_TTL) {
    await refreshUA();
    // Notify all Netflix tabs of the updated UA
    const tabs = await chrome.tabs.query({ url: "*://*.netflix.com/*" });
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, { type: "UPDATE_UA", enabled, ua: activeUA }).catch(() => {});
    }
  }
});
