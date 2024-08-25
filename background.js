let trackedUrls = {};
let currentUrl = null;
let startTime = null;
let urlSettings = {};

// Load tracked URLs and settings from storage when the extension starts
chrome.storage.local.get(['trackedUrls', 'urlSettings'], (result) => {
  if (result.trackedUrls) {
    trackedUrls = result.trackedUrls;
  }
  if (result.urlSettings) {
    urlSettings = result.urlSettings;
  }
});

function shouldTrackUrl(url) {
    return !urlSettings[url] || urlSettings[url].action !== 'ignore';
}

function updateTimeSpent() {
  if (currentUrl && startTime && !urlSettings[currentUrl]?.ignore) {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    trackedUrls[currentUrl] = (trackedUrls[currentUrl] || 0) + timeSpent;
    chrome.storage.local.set({ trackedUrls: trackedUrls });

    chrome.runtime.sendMessage({
      action: "timeUpdate",
      url: currentUrl,
      timeSpent: trackedUrls[currentUrl]
    }).catch(error => {
      // Ignore "Receiving end does not exist" errors
      if (error.message !== "Could not establish connection. Receiving end does not exist.") {
        console.error("Error sending timeUpdate message:", error);
      }
    });
  }
  startTime = Date.now();
}

// Set up interval to periodically update time spent
setInterval(updateTimeSpent, 1000);

// Update active tab tracking
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    updateTimeSpent();
    try {
      const url = new URL(tab.url);
      currentUrl = url.hostname;
      console.log("Current URL set to:", currentUrl);
      startTime = Date.now();
    } catch (error) {
      console.error("Invalid URL:", tab.url);
      currentUrl = null;
      startTime = null;
    }
  });
});

// Track URL changes within the same tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        updateTimeSpent();
        currentUrl = new URL(tab.url).hostname;
        if (shouldTrackUrl(currentUrl)) {
            startTime = Date.now();
        } else {
            startTime = null;
        }
    }
});

// Listen for messages from popup or stats page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getTimeForCurrentUrl") {
        sendResponse({ timeSpent: trackedUrls[currentUrl] || 0 });
        return true;
    } else if (request.action === "updateUrlSettings") {
        urlSettings[request.url] = request.settings;
        chrome.storage.local.set({ urlSettings: urlSettings });
        console.log('Updated settings for', request.url, request.settings);
        
        if (request.settings.action === 'ignore' && trackedUrls[request.url]) {
            delete trackedUrls[request.url];
            chrome.storage.local.set({ trackedUrls: trackedUrls });
        }
        
        if (currentUrl === request.url && request.settings.action === 'ignore') {
            startTime = null;
        }
        
        sendResponse({ success: true });
        return true;
    }
});