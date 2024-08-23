function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
}

function secondsToHours(seconds) {
    return seconds / 3600;
}

function getDomainFromUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch (e) {
        return url; // Return the original string if it's not a valid URL
    }
}

document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get('trackedUrls', function(result) {
        const trackedUrls = result.trackedUrls || {};
        const data = Object.entries(trackedUrls)
            .sort((a, b) => b[1] - a[1]); // Sort by time spent, descending

        const labels = data.slice(0, 10).map(item => getDomainFromUrl(item[0]));
        const timeSpent = data.slice(0, 10).map(item => secondsToHours(item[1]));

        // Create the chart
        const ctx = document.getElementById('statsChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Time Spent',
                    data: timeSpent,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Time (hours)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(2) + 'h';
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Websites'
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
                                const hours = context.raw;
                                const totalSeconds = Math.round(hours * 3600);
                                return formatTime(totalSeconds);
                            }
                        }
                    }
                }
            }
        });

        // Populate the table
        const tableBody = document.querySelector('#statsTable tbody');
        data.forEach(([url, time]) => {
            const row = tableBody.insertRow();
            const cellUrl = row.insertCell(0);
            const cellTime = row.insertCell(1);
            cellUrl.textContent = url;
            cellUrl.className = 'url-cell';
            cellUrl.title = url; // Add tooltip for full URL
            cellTime.textContent = formatTime(time);
        });
    });
});