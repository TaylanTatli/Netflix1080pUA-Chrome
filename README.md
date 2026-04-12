# Netflix 1080p UA

Forces Netflix to stream at 1080p.

## Description

Forces Netflix to stream at 1080p on Chrome/Linux by spoofing the User‑Agent to an Opera-on-Linux UA. Click the icon to toggle.

## Installation

### Chrome Browser

1. Open `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select this directory

### Chromium-Based Browsers (Edge, Brave, Opera)

1. Open the extensions page (e.g., `edge://extensions/`, `brave://extensions/`, `opera://extensions/`)
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this directory

## Usage

Click the extension icon to toggle it on/off.

### Checking Video Quality

To verify Netflix is streaming at 1080p:

1. Open Netflix and start playing a video
2. Press `Ctrl+Shift+Alt+D` (or `Ctrl+Shift+Option+D` on Mac) to open the stats overlay
3. The bitrate and resolution should show in the left center

### Troubleshooting

If Netflix is not streaming in 1080p:

1. **Toggle the extension** — Click the extension icon to disable it, then enable it again
2. **Refresh the tab** — Press `F5` or `Ctrl+R` to reload the Netflix page
3. **Check the panel** — A small panel appears when clicking the extension icon; confirm it shows "Enabled"

If issues persist, try clearing your browser cache and reloading Netflix.

## Technical Details

- **Manifest Version**: 3 (Chrome/Chromium)
- **Required Permissions**: webRequest, storage, tabs, webNavigation
- **Host Permissions**: Netflix domains and user-agent API source

## Credits

This project is forked from [majackie/Netflix1080pUA](https://github.com/majackie/Netflix1080pUA) and has been adapted and maintained for Chrome and Chromium-based browsers.

**Note:** This fork has been created and maintained with the assistance of AI (Vibe Coding). The code and implementations are AI-assisted creations.

## Contributors

[Jackie Ma](https://github.com/majackie)
