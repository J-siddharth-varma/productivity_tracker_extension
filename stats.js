let pieChart = null;
let barChart = null;

function updateStatsPage() {
    chrome.storage.local.get(['trackedUrls', 'urlSettings'], function(result) {
        console.log('Retrieved data:', result);
        const trackedUrls = result.trackedUrls || {};
        const urlSettings = result.urlSettings || {};
        
        const labels = Object.keys(trackedUrls);
        const data = Object.values(trackedUrls);
        
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

        const deleteCell = row.insertCell(3);
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.classList.add('delete-btn');
        deleteButton.addEventListener('click', () => deleteWebsite(url));
        deleteCell.appendChild(deleteButton);
    });
}

function deleteWebsite(url) {
    console.log('Attempting to delete:', url);
    if (confirm(`Are you sure you want to delete ${url} from the tracking list?`)) {
        chrome.storage.local.get(['trackedUrls', 'urlSettings'], function(result) {
            console.log('Current storage before deletion:', result);
            let trackedUrls = result.trackedUrls || {};
            let urlSettings = result.urlSettings || {};

            delete trackedUrls[url];
            delete urlSettings[url];

            console.log('Updated trackedUrls:', trackedUrls);
            console.log('Updated urlSettings:', urlSettings);

            chrome.storage.local.set({ trackedUrls: trackedUrls, urlSettings: urlSettings }, function() {
                console.log('Storage updated after deletion');
                chrome.storage.local.get(['trackedUrls', 'urlSettings'], function(updatedResult) {
                    console.log('Verified storage after deletion:', updatedResult);
                    updateStatsPage();
                });
            });
        });
    }
}

function updateUrlSettings(url, action) {
    chrome.storage.local.get(['urlSettings'], (result) => {
        let urlSettings = result.urlSettings || {};
        urlSettings[url] = { action: action };
        
        if (action === 'time-limit') {
            const timeLimit = prompt("Enter time limit in minutes:");
            if (timeLimit) {
                urlSettings[url].timeLimit = parseInt(timeLimit) * 60; // Convert to seconds
            } else {
                urlSettings[url].action = 'none';
            }
        }

        chrome.storage.local.set({ urlSettings: urlSettings }, () => {
            console.log('Settings updated for', url);
            updateStatsPage();
        });
    });
}

document.addEventListener('DOMContentLoaded', updateStatsPage);