document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get('trackedUrls', function(result) {
        const trackedUrls = result.trackedUrls || {};
        const data = Object.entries(trackedUrls)
            .sort((a, b) => b[1] - a[1]) // Sort by time spent, descending
            .slice(0, 10); // Get top 10 sites

        const labels = data.map(item => item[0]);
        const timeSpent = data.map(item => item[1]);

        const ctx = document.getElementById('statsChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Time Spent (seconds)',
                    data: timeSpent,
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
                                const seconds = context.raw;
                                const hours = Math.floor(seconds / 3600);
                                const minutes = Math.floor((seconds % 3600) / 60);
                                const remainingSeconds = seconds % 60;
                                return `${hours}h ${minutes}m ${remainingSeconds}s`;
                            }
                        }
                    }
                }
            }
        });
    });
});