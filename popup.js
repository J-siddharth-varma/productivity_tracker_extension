let currentUrl = '';
let intervalId;

function updateTimer() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].url) {
            try {
                const url = new URL(tabs[0].url);
                const hostname = url.hostname;
                if (hostname !== currentUrl) {
                    currentUrl = hostname;
                    updateTimerDisplay();
                }
                
                // Check and reset daily tracking
                chrome.storage.local.get(['trackedUrls', 'urlSettings', 'lastResetDate'], function(result) {
                    const trackedUrls = result.trackedUrls || {};
                    const urlSettings = result.urlSettings || {};
                    const lastResetDate = result.lastResetDate || new Date().toDateString();
                    
                    // Check if we need to reset (new day)
                    const today = new Date().toDateString();
                    if (today !== lastResetDate) {
                        // Reset all tracked times
                        for (let url in trackedUrls) {
                            trackedUrls[url] = 0;
                        }
                        // Update the reset date
                        chrome.storage.local.set({ 
                            trackedUrls,
                            lastResetDate: today 
                        });
                    }
                    
                    // Update time tracking
                    if (!urlSettings[hostname]?.action === 'ignore') {
                        trackedUrls[hostname] = (trackedUrls[hostname] || 0) + 1;
                        chrome.storage.local.set({ trackedUrls });
                    }
                });
            } catch (error) {
                console.error("Invalid URL:", tabs[0].url);
            }
        }
    });
}

function updateTimerDisplay() {
    chrome.storage.local.get(['trackedUrls', 'urlSettings'], function(result) {
        const trackedUrls = result.trackedUrls || {};
        const urlSettings = result.urlSettings || {};
        const timerElement = document.getElementById('timer');

        if (urlSettings[currentUrl]?.action === 'ignore') {
            timerElement.textContent = 'Ignored';
        } else {
            const timeSpent = trackedUrls[currentUrl] || 0;
            timerElement.textContent = formatTime(timeSpent);
        }
    });
}

function formatTime(seconds) {
     const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [hours, minutes, secs]
        .map(v => v < 10 ? "0" + v : v)
        .join(":");
}

document.addEventListener('DOMContentLoaded', function() {
    updateTimer();
    intervalId = setInterval(updateTimer, 1000);

    document.getElementById('viewStats').addEventListener('click', function() {
        chrome.tabs.create({url: 'stats.html'});
    });
});

// Stop the interval when the popup is closed
window.addEventListener('unload', function() {
    clearInterval(intervalId);
});