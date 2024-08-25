function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
}

function updateStatsPage() {
    chrome.storage.local.get(['trackedUrls', 'urlSettings'], function(result) {
        const trackedUrls = result.trackedUrls || {};
        const urlSettings = result.urlSettings || {};
        
        const labels = Object.keys(trackedUrls);
        const data = Object.values(trackedUrls);
        
        createPieChart(labels, data);
        createBarChart(labels, data);
        populateTable(labels, urlSettings);
    });
}

function createPieChart(labels, data) {
    const ctx = document.getElementById('pieChart').getContext('2d');
    new Chart(ctx, {
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
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${formatTime(value)}`;
                        }
                    }
                }
            }
        }
    });
}

function createBarChart(labels, data) {
    const ctx = document.getElementById('barChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Time Spent',
                data: data,
                backgroundColor: [
                    '#9b59b6', '#e74c3c', '#f1c40f', '#2ecc71', '#3498db',
                    '#1abc9c', '#34495e', '#16a085', '#27ae60', '#2980b9'
                ]
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
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Time Spent: ${formatTime(context.raw)}`;
                        }
                    }
                }
            }
        }
    });
}

function populateTable(labels, urlSettings) {
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
    if (confirm(`Are you sure you want to delete ${url} from the tracking list?`)) {
        chrome.storage.local.get(['trackedUrls', 'urlSettings'], function(result) {
            let trackedUrls = result.trackedUrls || {};
            let urlSettings = result.urlSettings || {};

            delete trackedUrls[url];
            delete urlSettings[url];

            chrome.storage.local.set({ trackedUrls: trackedUrls, urlSettings: urlSettings }, function() {
                console.log('Website deleted:', url);
                updateStatsPage();
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