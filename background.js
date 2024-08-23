let trackedUrls = {};
let currentUrl;
let startTime;

function updateTimeSpent() {
  if (currentUrl && startTime) {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    trackedUrls[currentUrl] = (trackedUrls[currentUrl] || 0) + timeSpent;
    chrome.storage.local.set({ trackedUrls: trackedUrls });
    startTime = Date.now(); // Reset start time for next interval
  }
}

function handleUrlChange(url) {
  if (url !== currentUrl) {
    updateTimeSpent(); // Update time for previous URL
    currentUrl = url;
    startTime = Date.now();
  }
}

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      handleUrlChange(tab.url);
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active && tab.url) {
    handleUrlChange(tab.url);
  }
});

// Update time every minute
setInterval(updateTimeSpent, 60000);

// Update time when the browser is about to close
chrome.runtime.onSuspend.addListener(updateTimeSpent);

// Load tracked URLs from storage when the extension starts
chrome.storage.local.get('trackedUrls', (result) => {
  if (result.trackedUrls) {
    trackedUrls = result.trackedUrls;
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getTimeForCurrentUrl") {
    if (currentUrl) {
      const storedTime = trackedUrls[currentUrl] || 0;
      const currentSessionTime = Math.round((Date.now() - startTime) / 1000);
      sendResponse({ timeSpent: storedTime + currentSessionTime });
    } else {
      sendResponse({ timeSpent: 0 });
    }
    return true; // Indicates that the response is sent asynchronously
  }
});