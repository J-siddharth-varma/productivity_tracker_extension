# Time Tracker Chrome Extension

## Description

Time Tracker is a Chrome extension designed to help users monitor and manage their time spent on various websites. It provides a simple and intuitive interface to track browsing habits, set limitations, and visualize usage statistics.

## Features

- Real-time tracking of time spent on websites
- Pie chart and bar graph visualization of website usage
- Ability to set limitations (ignore or time limit) for specific websites
- Option to delete tracked websites
- Popup display showing current website's tracked time
- Statistics page for detailed time analysis

## Installation

1. Clone this repository or download the source code.
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the directory containing the extension files.

## Usage

### Popup

- Click on the extension icon in the Chrome toolbar to view the current website's tracked time.
- Use the "View Statistics" button to open the detailed stats page.

### Statistics Page

- View pie chart and bar graph representations of your website usage.
- Set limitations for specific websites using the dropdown menu.
- Delete tracked websites using the delete button.

## File Structure

- `manifest.json`: Extension configuration file
- `background.js`: Background script for time tracking
- `popup.html` & `popup.js`: Popup interface
- `stats.html` & `stats.js`: Statistics page
- `chart.js`: Chart library for data visualization
- `stats.css` & `popup.css`: Styling for the extension pages
- `blocked.html`: Page displayed when a time limit is reached

## Development

To modify the extension:

1. Edit the relevant files (e.g., `background.js` for tracking logic, `stats.js` for statistics page functionality).
2. Save your changes.
3. Go to `chrome://extensions/` in Chrome.
4. Click the refresh icon on the Time Tracker extension card.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).
