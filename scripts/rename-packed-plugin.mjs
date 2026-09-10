import fs from 'node:fs';
import path from 'node:path';

const distDir = 'dist';
const expectedArtifactName = 'com.peterneave.streamdeck-plugin-au-uv.sdPlugin.streamDeckPlugin';
const artifactNames = fs.readdirSync(distDir).filter((name) => name.endsWith('.streamDeckPlugin'));

if (artifactNames.length !== 1) {
  throw new Error(`Expected exactly one packaged plugin artifact in ${distDir}, found ${artifactNames.length}`);
}

const sourcePath = path.join(distDir, artifactNames[0]);
const destinationPath = path.join(distDir, expectedArtifactName);

if (sourcePath !== destinationPath) {
  if (fs.existsSync(destinationPath)) {
    fs.rmSync(destinationPath, { force: true });
  }

  fs.renameSync(sourcePath, destinationPath);
}
