let pieChart = null;
let barChart = null;
let deletionQueue = [];

function updateStatsPage() {
    chrome.storage.local.get(['trackedUrls', 'urlSettings'], function(result) {
        console.log('Retrieved data:', result);
        const trackedUrls = result.trackedUrls || {};
        const urlSettings = result.urlSettings || {};
        
        // Filter out invalid entries
        const validUrls = Object.keys(trackedUrls).filter(url => url && url !== 'null' && url !== 'undefined');
        
        const labels = validUrls;
        const data = validUrls.map(url => trackedUrls[url]);
        
        console.log('Labels:', labels);
        console.log('Data:', data);

        createPieChart(labels, data);
        createBarChart(labels, data);
        populateTable(labels, urlSettings, trackedUrls);
    });
}

function createPieChart(labels, data) {
    const ctx = document.getElementById('pieChart').getContext('2d');
    if (pieChart) {
        pieChart.destroy();
    }
    pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#9b59b6', '#e74c3c', '#f1c40f', '#2ecc71', '#3498db',
                    '#1abc9c', '#34495e', '#16a085', '#27ae60', '#2980b9'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function createBarChart(labels, data) {
    const ctx = document.getElementById('barChart').getContext('2d');
    if (barChart) {
        barChart.destroy();
    }
    barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Time Spent',
                data: data,
                backgroundColor: '#3498db'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatTime(value);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Time Spent: ' + formatTime(context.raw);
                        }
                    }
                }
            }
        }
    });
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
}

function deleteWebsite(url) {
    console.log('Attempting to delete:', url);
    if (confirm(`Are you sure you want to delete ${url} from the tracking list?`)) {
        deletionQueue.push(url);
        // Remove the row from the table immediately for visual feedback
        removeTableRow(url);
        // Process the deletion queue
        processDeletionQueue();
    }
}

function removeTableRow(url) {
    const tableBody = document.querySelector('#statsTable tbody');
    const rows = tableBody.querySelectorAll('tr');
    rows.forEach((row) => {
        if (row.cells[1].textContent === url) {
            row.remove();
        }
    });
}

function processDeletionQueue() {
    if (deletionQueue.length === 0) {
        return;
    }

    chrome.storage.local.get(['trackedUrls', 'urlSettings'], function(result) {
        console.log('Current storage before deletion:', result);
        let trackedUrls = result.trackedUrls || {};
        let urlSettings = result.urlSettings || {};

        deletionQueue.forEach(url => {
            delete trackedUrls[url];
            delete urlSettings[url];
        });

        console.log('Updated trackedUrls:', trackedUrls);
        console.log('Updated urlSettings:', urlSettings);

        chrome.storage.local.set({ trackedUrls: trackedUrls, urlSettings: urlSettings }, function() {
            console.log('Storage updated after deletion');
            chrome.storage.local.get(['trackedUrls', 'urlSettings'], function(updatedResult) {
                console.log('Verified storage after deletion:', updatedResult);
                // Clear the deletion queue
                deletionQueue = [];
                // Update the charts without refreshing the entire page
                updateCharts(Object.keys(trackedUrls), Object.values(trackedUrls));
            });
        });
    });
}

function updateCharts(labels, data) {
    createPieChart(labels, data);
    createBarChart(labels, data);
}

function updateUrlSettings(url, action) {
    chrome.storage.local.get(['urlSettings', 'trackedUrls'], (result) => {
        let urlSettings = result.urlSettings || {};
        let trackedUrls = result.trackedUrls || {};

        urlSettings[url] = { action: action };
        
        if (action === 'time-limit') {
            const timeLimit = prompt("Enter time limit in format HH:MM:SS:");
            if (timeLimit) {
                const seconds = parseTimeLimit(timeLimit);
                if (seconds !== null) {
                    urlSettings[url].timeLimit = seconds;
                } else {
                    alert("Invalid time format. Please use HH:MM:SS.");
                    urlSettings[url].action = 'none';
                }
            } else {
                urlSettings[url].action = 'none';
            }
        } else if (action === 'ignore') {
            // If ignoring, keep the tracked time but mark it as ignored
            if (!trackedUrls.hasOwnProperty(url)) {
                trackedUrls[url] = 0;
            }
        }

        chrome.storage.local.set({ urlSettings: urlSettings, trackedUrls: trackedUrls }, () => {
            console.log('Settings updated for', url);
            updateStatsPage();
        });
    });
}

function parseTimeLimit(timeString) {
    const parts = timeString.split(':');
    if (parts.length !== 3) {
        return null;
    }
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) ||
        minutes >= 60 || seconds >= 60) {
        return null;
    }
    
    return hours * 3600 + minutes * 60 + seconds;
}

function formatTimeLimit(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [hours, minutes, secs]
        .map(v => v < 10 ? "0" + v : v)
        .join(":");
}

function populateTable(labels, urlSettings, trackedUrls) {
    const tableBody = document.querySelector('#statsTable tbody');
    tableBody.innerHTML = '';

    labels.forEach((url, index) => {
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = index + 1;
        row.insertCell(1).textContent = url;
        
        const limitationCell = row.insertCell(2);
        const select = document.createElement('select');
        select.innerHTML = `
            <option value="none">None</option>
            <option value="ignore">Ignore</option>
            <option value="time-limit">Time-limit</option>
        `;
        select.value = urlSettings[url]?.action || 'none';
        select.addEventListener('change', (event) => {
            updateUrlSettings(url, event.target.value);
        });
        limitationCell.appendChild(select);

        const timeCell = row.insertCell(3);
        if (urlSettings[url]?.action === 'ignore') {
            timeCell.textContent = 'Ignored';
        } else if (urlSettings[url]?.action === 'time-limit') {
            timeCell.textContent = `${formatTime(trackedUrls[url] || 0)} / ${formatTimeLimit(urlSettings[url].timeLimit)}`;
        } else {
            timeCell.textContent = formatTime(trackedUrls[url] || 0);
        }

        const deleteCell = row.insertCell(4);
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.classList.add('delete-btn');
        deleteButton.addEventListener('click', () => deleteWebsite(url));
        deleteCell.appendChild(deleteButton);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    updateStatsPage();

    // Add clear all functionality
    document.getElementById('clearAllStats').addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all tracking statistics? This cannot be undone.')) {
            chrome.storage.local.get(['urlSettings'], function(result) {
                chrome.storage.local.set({ 
                    trackedUrls: {},
                    lastResetDate: new Date().toDateString(),
                    // Preserve urlSettings structure but clear all tracked data
                    urlSettings: {},
                }, function() {
                    // Refresh the stats display
                    displayStats();
                });
            });
        }
    });
});