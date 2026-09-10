import fs from 'node:fs';
import path from 'node:path';

const distDir = 'dist';
const expectedArtifactName = 'com.peterneave.streamdeck-plugin-au-uv.sdPlugin.streamDeckPlugin';
const pluginArtifactPrefix = 'com.peterneave.streamdeck-plugin-au-uv';
const destinationPath = path.join(distDir, expectedArtifactName);
const artifactNames = fs
  .readdirSync(distDir)
  .filter((name) => name.endsWith('.streamDeckPlugin') && name.startsWith(pluginArtifactPrefix));
const newArtifactNames = artifactNames.filter((name) => name !== expectedArtifactName);

if (newArtifactNames.length === 0) {
  if (!artifactNames.includes(expectedArtifactName)) {
    throw new Error(`Expected a packaged plugin artifact in ${distDir}`);
  }
} else if (newArtifactNames.length === 1) {
  const sourcePath = path.join(distDir, newArtifactNames[0]);

  if (sourcePath !== destinationPath) {
    if (fs.existsSync(destinationPath)) {
      fs.rmSync(destinationPath, { force: true });
    }

    fs.renameSync(sourcePath, destinationPath);
  }
} else {
  throw new Error(`Expected exactly one new packaged plugin artifact in ${distDir}, found ${newArtifactNames.length}`);
}
