# streamdeck-plugin-au-uv

Stream Deck plugin project that displays current Australian UV index values from:

- https://uvdata.arpansa.gov.au/xml/uvvalues.xml

## Features

- Shows current UV value on key title
- Location is selected by location ID in the property inspector
- Refresh modes:
  - On demand (refresh only when key is pressed)
  - Every 5 minutes
  - Every 10 minutes
  - Every 30 minutes
  - Every 60 minutes

## Project structure

- `/com.peterneave.streamdeck-plugin-au-uv.sdPlugin/plugin.js` - plugin runtime and refresh scheduling
- `/com.peterneave.streamdeck-plugin-au-uv.sdPlugin/uv-data.js` - UV XML fetch + parsing helpers
- `/com.peterneave.streamdeck-plugin-au-uv.sdPlugin/propertyinspector` - location and refresh interval settings UI
- `/com.peterneave.streamdeck-plugin-au-uv.sdPlugin/manifest.json` - Stream Deck plugin manifest

## Development

```bash
npm install
npm test
```
