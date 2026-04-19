// Runs synchronously at document_start in the MAIN world.
// Safely bypasses CSP and evaluates before Netflix evaluates browser capabilities.

const FALLBACK_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 OPR/120.0.0.0";

function injectNetflixSpoof(ua) {
  if (window.__NETFLIX_1080P_UA_SETUP__) return;
  Object.defineProperty(window, '__NETFLIX_1080P_UA_SETUP__', { value: true, writable: false });

  // Clear Netflix's cached playback capabilities
  function clearNetflixCaches() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('playback') || key.includes('capability') || key.includes('msl') || key.includes('drm'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('playback') || key.includes('capability'))) {
          sessionStorage.removeItem(key);
        }
      }
      
      if (window.indexedDB && window.indexedDB.databases) {
        window.indexedDB.databases().then(dbs => {
          for (const db of dbs) {
            if (db.name && (db.name.includes('netflix') || db.name.includes('nflx') || db.name.includes('playback') || db.name.includes('drm'))) {
              window.indexedDB.deleteDatabase(db.name);
            }
          }
        }).catch(() => {});
      }
    } catch (e) {}
  }

  // Intercept SPA routing natively
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  // The secret to fixing 1080p on SPA routing:
  // Netflix stores DRM capabilities in JavaScript memory (React/Redux state).
  // Clearing caches isn't enough unless the page is fully reloaded.
  // So, when Netflix tries to SPA-navigate to a video, we force a real navigation!
  history.pushState = function(state, unused, url) {
    clearNetflixCaches();
    
    if (url && typeof url === 'string' && (url.includes('/watch') || url.includes('/title/'))) {
      console.log("[Netflix 1080p UA] Forcing hard navigation to video for 1080p playback...");
      window.location.href = url;
      return;
    }
    
    return originalPushState.apply(this, arguments);
  };
  
  history.replaceState = function(state, unused, url) {
    clearNetflixCaches();
    return originalReplaceState.apply(this, arguments);
  };

  // Initial clear on first load
  clearNetflixCaches();

  // Inject UA into navigator object
  const props = {
    userAgent: () => ua,
    appVersion: () => ua.replace("Mozilla/", ""),
    platform: () => "Linux x86_64",
    vendor: () => "Google Inc.",
    appName: () => "Netscape"
  };
  
  for (const [key, get] of Object.entries(props)) {
    try {
      Object.defineProperty(navigator, key, { get, configurable: true });
    } catch (e) {}
  }
  
  console.log("[Netflix 1080p UA] Spoof initialized and SPA handled synchronously (MAIN WORLD)!");
}

injectNetflixSpoof(FALLBACK_UA);


