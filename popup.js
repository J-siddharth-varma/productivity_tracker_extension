let timerInterval;
let startTime;
let currentUrl;

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${secs}`;
}

function updateTimer() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0] && tabs[0].url) {
      const url = new URL(tabs[0].url).hostname;
      if (url !== currentUrl) {
        currentUrl = url;
        chrome.storage.local.get('trackedUrls', (result) => {
          const trackedUrls = result.trackedUrls || {};
          startTime = Date.now() - (trackedUrls[currentUrl] || 0) * 1000;
        });
      }
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      document.getElementById('timer').textContent = formatTime(timeSpent);
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0] && tabs[0].url) {
      currentUrl = new URL(tabs[0].url).hostname;
      chrome.storage.local.get('trackedUrls', (result) => {
        const trackedUrls = result.trackedUrls || {};
        startTime = Date.now() - (trackedUrls[currentUrl] || 0) * 1000;
        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
      });
    }
  });
  
  document.getElementById('viewStats').addEventListener('click', () => {
    chrome.tabs.create({ url: 'stats.html' });
  });
});

window.addEventListener('unload', function() {
  clearInterval(timerInterval);
});