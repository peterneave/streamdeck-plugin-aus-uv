# AU UV Index for Stream Deck

A Stream Deck plugin that displays current Australian UV index readings from the [ARPANSA UV data feed](https://uvdata.arpansa.gov.au/xml/uvvalues.xml). Monitor the latest UV value for a selected location directly on your Elgato Stream Deck.

![Version](https://img.shields.io/badge/version-0.1.0.0-blue)
![Node.js](https://img.shields.io/badge/node-20-green)
![Stream Deck SDK](https://img.shields.io/badge/Stream%20Deck%20SDK-2-orange)

## Images

Screenshots coming soon.

## Features

- **Current UV Reading**: Displays the latest UV index for the selected Australian location
- **Location Picker**: Choose a supported location from the Property Inspector dropdown
- **Manual Refresh**: Refresh the UV value immediately by pressing the key
- **Auto-Refresh Options**: Configure 5, 10, 30, or 60 minute refresh intervals
- **Cached Location Data**: Reuses fetched location data to reduce unnecessary network requests
- **Error Handling**: Shows clear key states for missing settings, unavailable locations, and fetch failures

## Prerequisites

- **Elgato Stream Deck**: Software version 6.6 or higher
- **Operating System**:
  - Windows 10 or higher
  - macOS 13 or higher
- **Node.js**: Version 20 or higher
- **Internet Access**: Required to reach the ARPANSA UV feed

## Installation

### For Users

1. Build or download the latest `.streamDeckPlugin` package
2. Double-click the package to install it in Stream Deck
3. Drag the **AU UV Index** action to a key
4. Choose a location and refresh interval in the Property Inspector

### For Developers

See [Building from Source](#building-from-source) below.

## Configuration

After adding the action to your Stream Deck:

1. **Click the action** to open the Property Inspector
2. **Choose a location** from the ARPANSA-backed location list
3. **Select a refresh interval**:
   - On demand
   - Every 5 minutes
   - Every 10 minutes
   - Every 30 minutes
   - Every 60 minutes
4. **Press the key** at any time to force an immediate refresh

## Building from Source

### Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/peterneave/streamdeck-plugin-aus-uv.git
   cd streamdeck-plugin-aus-uv
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Open the repo in VS Code or a dev container**:

   - `.devcontainer/devcontainer.json` installs Node.js 20 tooling and runs `npm install`
   - `.vscode/tasks.json` includes pack and link tasks for local Stream Deck development

### Build Commands

- **Validation Build**:

  ```bash
  npm run build
  ```

  Runs the existing automated test suite with Node's built-in test runner.

- **Pack Plugin**:

  ```bash
  npm run pack
  ```

  Runs the tests, then packages `com.peterneave.streamdeck-plugin-au-uv.sdPlugin` into a distributable `.streamDeckPlugin` file, overwriting any previous build artifact.

- **Link Plugin for Development**:

  ```bash
  npm run link
  ```

  Links the plugin bundle into the local Stream Deck installation for iterative testing.

### VS Code Shortcuts

- **Pack plugin**: Press `Ctrl+Shift+B` and run the default build task (`Build Pack`)
- **Run tests**: Open Command Palette and run `Tasks: Run Task` → `npm: build`
- **Link plugin**: Open Command Palette and run `Tasks: Run Task` → `Link`

### Development Workflow

1. **Install dependencies** with `npm install`
2. **Link the plugin** the first time with `npm run link`
3. **Edit the plugin files** in `com.peterneave.streamdeck-plugin-au-uv.sdPlugin/`
4. **Run validation** with `npm run build`
5. **Pack a fresh plugin** with `npm run pack` when you want an installable artifact
6. **Reload Stream Deck** or reinstall the packaged plugin to test the latest changes

### Project Structure

```text
streamdeck-plugin-aus-uv/
├── .devcontainer/                               # Dev container configuration
├── .vscode/                                     # VS Code tasks and workspace settings
├── com.peterneave.streamdeck-plugin-au-uv.sdPlugin/
│   ├── manifest.json                            # Stream Deck plugin metadata
│   ├── plugin.js                                # Plugin runtime and refresh handling
│   ├── uv-data.js                               # ARPANSA XML fetch and parsing helpers
│   ├── images/                                  # Plugin and action icons
│   └── propertyinspector/
│       ├── index.html                           # Settings UI
│       └── index.js                             # Property Inspector logic
├── test/                                        # Automated tests
├── package.json                                 # npm scripts and dependencies
├── package-lock.json                            # Locked dependency versions
└── README.md                                    # This file
```

## API Reference

The plugin uses the ARPANSA UV XML feed:

1. **Fetch UV data**: `GET https://uvdata.arpansa.gov.au/xml/uvvalues.xml`
2. **Parse locations**: Extracts location identifiers, names, and current UV values from the XML response

## Troubleshooting

### Plugin doesn't appear in Stream Deck

- Verify Node.js 20 is installed: `node --version`
- Check Stream Deck version is 6.6+
- Confirm the plugin bundle was packed from `com.peterneave.streamdeck-plugin-au-uv.sdPlugin`

### No locations are available

- Verify you have internet access to `uvdata.arpansa.gov.au`
- Reopen the Property Inspector to request the location list again
- Run `npm test` to confirm the local parser tests still pass

### Data is not updating

- Verify a location is selected in the Property Inspector
- Check whether the action is using `On demand` refresh mode
- Press the key to force a refresh and confirm the key title changes

## Related Links

- [Stream Deck SDK Documentation](https://docs.elgato.com/streamdeck/sdk/)
- [ARPANSA UV Data Feed](https://uvdata.arpansa.gov.au/xml/uvvalues.xml)
- [Elgato Stream Deck](https://www.elgato.com/stream-deck)

---

**Disclaimer**: This plugin is not officially affiliated with or endorsed by ARPANSA or Elgato. Use at your own risk.
