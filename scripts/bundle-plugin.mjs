import { writeFile } from 'node:fs/promises';
import { build } from 'esbuild';

const pluginDir = 'com.peterneave.streamdeck-plugin-au-uv.sdPlugin';

// Stream Deck runs the plugin from the packed folder, which has no node_modules,
// so everything (ws, fast-xml-parser) is bundled into a single CommonJS file.
// bufferutil and utf-8-validate are optional native speedups that ws loads in try/catch.
await build({
  entryPoints: [`${pluginDir}/plugin.js`],
  outfile: `${pluginDir}/bin/plugin.js`,
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  external: ['bufferutil', 'utf-8-validate'],
  logLevel: 'info',
});

// The repo root is "type": "module", which a linked plugin would inherit. Pin the
// bundle's folder to CommonJS so it runs the same linked or packed.
await writeFile(`${pluginDir}/bin/package.json`, '{ "type": "commonjs" }\n');
