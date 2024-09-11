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
    intervalId = setInterval(updateTimerDisplay, 1000);

    document.getElementById('viewStats').addEventListener('click', function() {
        // Open the detailed statistics page
        chrome.tabs.create({url: 'stats.html'});
    });

    document.getElementById('viewDashboard').addEventListener('click', function() {
        // Open the dashboard page
        chrome.tabs.create({url: 'dashboard.html'});
    });
});

// Close the modal when the user clicks on <span> (x)
document.querySelector('.close').addEventListener('click', function() {
    document.getElementById('statsModal').style.display = 'none';
});

// Close the modal when the user clicks anywhere outside of the modal
window.addEventListener('click', function(event) {
    if (event.target === document.getElementById('statsModal')) {
        document.getElementById('statsModal').style.display = 'none';
    }
});

function populateStatistics() {
    // Fetch data and populate the charts and usage list
    const labels = ['www.youtube.com', 'www.sih.gov.in', 'github.com'];
    const data = [5000, 300, 120]; // Replace with actual data
    const dates = ['2023-10-01', '2023-10-01', '2023-10-01']; // Replace with actual dates

    updateCharts(labels, data, dates);

    const usageList = document.getElementById('usageList');
    usageList.innerHTML = ''; // Clear previous entries
    labels.forEach((label, index) => {
        const li = document.createElement('li');
        li.textContent = `${label}: ${data[index]} seconds on ${dates[index]}`;
        usageList.appendChild(li);
    });
}

// Stop the interval when the popup is closed
window.addEventListener('unload', function() {
    clearInterval(intervalId);
});