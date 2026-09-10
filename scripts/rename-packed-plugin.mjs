import fs from 'node:fs';
import path from 'node:path';

const distDir = 'dist';
const expectedArtifactName = 'com.peterneave.streamdeck-plugin-au-uv.sdPlugin.streamDeckPlugin';
const pluginArtifactPrefix = 'com.peterneave.streamdeck-plugin-au-uv';
const destinationPath = path.join(distDir, expectedArtifactName);

fs.mkdirSync(distDir, { recursive: true });

const artifactNames = fs
  .readdirSync(distDir)
  .filter((name) => name.endsWith('.streamDeckPlugin') && name.startsWith(pluginArtifactPrefix));
const newArtifactNames = artifactNames.filter((name) => name !== expectedArtifactName);

if (newArtifactNames.length === 0) {
  if (!artifactNames.includes(expectedArtifactName)) {
    throw new Error(`Expected a packaged plugin artifact in ${distDir}`);
  }
} else {
  const newestArtifactName = newArtifactNames
    .map((name) => ({ name, mtimeMs: fs.statSync(path.join(distDir, name)).mtimeMs }))
    .sort((left, right) => right.mtimeMs - left.mtimeMs)[0].name;
  const sourcePath = path.join(distDir, newestArtifactName);

  if (sourcePath !== destinationPath) {
    if (fs.existsSync(destinationPath)) {
      fs.rmSync(destinationPath, { force: true });
    }

    fs.renameSync(sourcePath, destinationPath);
  }
}
