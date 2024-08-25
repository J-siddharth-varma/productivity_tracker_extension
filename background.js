let trackedUrls = {};
let urlSettings = {};
let currentUrl = null;
let startTime = null;
let intervalId = null;

// Load tracked URLs and settings from storage when the extension starts
chrome.storage.local.get(['trackedUrls', 'urlSettings'], (result) => {
  trackedUrls = result.trackedUrls || {};
  urlSettings = result.urlSettings || {};
  console.log('Loaded trackedUrls:', trackedUrls);
  console.log('Loaded urlSettings:', urlSettings);
});

function updateTimeSpent() {
  if (currentUrl) {
    const now = Date.now();
    const timeSpent = Math.round((now - startTime) / 1000);
    trackedUrls[currentUrl] = (trackedUrls[currentUrl] || 0) + timeSpent;
    startTime = now;  // Reset startTime for the next interval

    chrome.storage.local.set({ trackedUrls: trackedUrls }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error updating storage:', chrome.runtime.lastError);
      } else {
        console.log(`Updated time for ${currentUrl}: ${trackedUrls[currentUrl]} seconds`);
      }
    });

    // Check if time limit is reached
    const setting = urlSettings[currentUrl];
    if (setting && setting.action === 'time-limit' && setting.timeLimit) {
      if (trackedUrls[currentUrl] >= setting.timeLimit) {
        blockWebsite(currentUrl);
      }
    }
  }
}

function blockWebsite(url) {
  chrome.tabs.query({url: `*://${url}/*`}, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.update(tab.id, {url: chrome.runtime.getURL('blocked.html')});
    });
  });
}

function unblockWebsite(url) {
  chrome.tabs.query({url: chrome.runtime.getURL('blocked.html')}, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.update(tab.id, {url: `https://${url}`});
    });
  });
}

function startTracking(url) {
  if (url !== currentUrl) {
    stopTracking();
    currentUrl = url;
    startTime = Date.now();
    console.log('Started tracking:', url);
    if (!intervalId) {
      intervalId = setInterval(updateTimeSpent, 1000); // Update every second
    }
  }
}

function stopTracking() {
  if (currentUrl) {
    updateTimeSpent();
    console.log('Stopped tracking:', currentUrl);
    currentUrl = null;
    startTime = null;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
}

function safeExecute(callback) {
  try {
    callback();
  } catch (error) {
    console.error('Error executing callback:', error);
  }
}

chrome.tabs.onActivated.addListener((activeInfo) => {
  safeExecute(() => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting tab:', chrome.runtime.lastError);
        return;
      }
      try {
        const url = new URL(tab.url);
        startTracking(url.hostname);
      } catch (error) {
        console.error("Invalid URL:", tab.url);
        stopTracking();
      }
    });
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    safeExecute(() => {
      try {
        const url = new URL(tab.url);
        startTracking(url.hostname);
      } catch (error) {
        console.error("Invalid URL:", tab.url);
        stopTracking();
      }
    });
  }
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  safeExecute(() => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      stopTracking();
    } else {
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (chrome.runtime.lastError) {
          console.error('Error querying tabs:', chrome.runtime.lastError);
          return;
        }
        if (tabs[0]) {
          try {
            const url = new URL(tabs[0].url);
            startTracking(url.hostname);
          } catch (error) {
            console.error("Invalid URL:", tabs[0].url);
            stopTracking();
          }
        }
      });
    }
  });
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    if (changes.urlSettings) {
      urlSettings = changes.urlSettings.newValue;
      console.log('Updated urlSettings:', urlSettings);
      // Check if any blocked websites need to be unblocked
      for (const [url, setting] of Object.entries(urlSettings)) {
        if (setting.action !== 'time-limit' || !setting.timeLimit) {
          unblockWebsite(url);
        }
      }
    }
    if (changes.trackedUrls) {
      trackedUrls = changes.trackedUrls.newValue;
      console.log('Updated trackedUrls:', trackedUrls);
    }
  }
});

// Start the interval when the background script loads
if (!intervalId) {
  intervalId = setInterval(updateTimeSpent, 1000);
}