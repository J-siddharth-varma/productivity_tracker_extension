let timerInterval;

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${secs}`;
}

function updateTimer() {
  chrome.runtime.sendMessage({action: "getTimeForCurrentUrl"}, (response) => {
    if (response && response.timeSpent !== undefined) {
      document.getElementById('timer').textContent = formatTime(response.timeSpent);
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
  
  document.getElementById('viewStats').addEventListener('click', () => {
    chrome.tabs.create({ url: 'stats.html' });
  });
});

window.addEventListener('unload', function() {
  clearInterval(timerInterval);
});