document.addEventListener('DOMContentLoaded', function() {
  const websiteName = document.getElementById('websiteName');
  const totalTimeElement = document.getElementById('totalTime');
  const sessionsElement = document.getElementById('sessions');
  const averageUsageElement = document.getElementById('averageUsage');
  const dateRangeInput = document.getElementById('dateRange');
  const barChartCanvas = document.getElementById('barChart');

  // Initialize the chart
  let barChart = new Chart(barChartCanvas, {
      type: 'bar',
      data: {
          labels: [], // Dates will be populated here
          datasets: [{
              label: 'Time Spent (hours)',
              data: [], // Time data will be populated here
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
          }]
      },
      options: {
          responsive: true,
          scales: {
              y: {
                  beginAtZero: true
              }
          }
      }
  });

  // Initialize Flatpickr for date range selection
  flatpickr(dateRangeInput, {
      mode: "range",
      dateFormat: "Y-m-d",
      onChange: function(selectedDates) {
          if (selectedDates.length === 2) {
              const startDate = selectedDates[0];
              const endDate = selectedDates[1];
              updateChartData(startDate, endDate);
          }
      }
  });

  // Fetch data from storage
  chrome.storage.local.get(['trackedUrls', 'urlSettings'], function(result) {
      const trackedUrls = result.trackedUrls || {};
      const urlSettings = result.urlSettings || {};
      const currentUrl = websiteName.textContent;

      // Calculate total time and sessions
      let totalTime = 0;
      let sessions = 0;
      let dailyUsage = {};

      for (const url in trackedUrls) {
          if (url === currentUrl) {
              totalTime += trackedUrls[url];
              sessions++;
              const date = new Date(); // Replace with actual date logic
              const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
              dailyUsage[dateKey] = (dailyUsage[dateKey] || 0) + trackedUrls[url];
          }
      }

      // Update total time and sessions
      totalTimeElement.textContent = `Total time: ${formatTime(totalTime)}`;
      sessionsElement.textContent = `Sessions: ${sessions}`;
      averageUsageElement.textContent = `Average daily usage: ${formatTime(totalTime / sessions)}`;

      // Update chart data
      barChart.data.labels = Object.keys(dailyUsage);
      barChart.data.datasets[0].data = Object.values(dailyUsage).map(time => time / 3600); // Convert to hours
      barChart.update();
  });

  // Function to update chart data based on selected date range
  function updateChartData(startDate, endDate) {
      // Logic to filter and update the chart based on the selected date range
      // This will require fetching the data for the specified range and updating the chart
  }

  // Helper function to format time
  function formatTime(seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hours} h ${minutes} m ${secs} s`;
  }
});