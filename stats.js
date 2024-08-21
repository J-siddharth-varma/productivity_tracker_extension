function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
}

document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get('trackedUrls', function(result) {
        const trackedUrls = result.trackedUrls || {};
        const data = Object.entries(trackedUrls)
            .sort((a, b) => b[1] - a[1]); // Sort by time spent, descending

        const labels = data.map(item => item[0]);
        const timeSpent = data.map(item => item[1]);

        // Create the chart
        const ctx = document.getElementById('statsChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.slice(0, 10), // Top 10 for the chart
                datasets: [{
                    label: 'Time Spent',
                    data: timeSpent.slice(0, 10), // Top 10 for the chart
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Time (seconds)'
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
                                return formatTime(context.raw);
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
            cellTime.textContent = formatTime(time);
        });
    });
});