import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function normalizePackedPluginArtifact({
  fsModule = fs,
  pathModule = path,
  distDir = 'dist',
  expectedArtifactName = 'com.peterneave.streamdeck-plugin-au-uv.sdPlugin.streamDeckPlugin',
  pluginArtifactPrefix = 'com.peterneave.streamdeck-plugin-au-uv',
} = {}) {
  const destinationPath = pathModule.join(distDir, expectedArtifactName);
  const backupDestinationPath = `${destinationPath}.bak`;

  fsModule.mkdirSync(distDir, { recursive: true });

  const artifactNames = fsModule
    .readdirSync(distDir)
    .filter((name) => name.endsWith('.streamDeckPlugin') && name.startsWith(pluginArtifactPrefix));
  const newArtifactNames = artifactNames.filter((name) => name !== expectedArtifactName);

  if (newArtifactNames.length === 0) {
    if (!artifactNames.includes(expectedArtifactName)) {
      throw new Error(`Expected a packaged plugin artifact in ${distDir}`);
    }
    return;
  }

  const newestArtifactName = newArtifactNames
    .map((name) => ({ name, mtimeMs: fsModule.statSync(pathModule.join(distDir, name)).mtimeMs }))
    .sort((left, right) => right.mtimeMs - left.mtimeMs)[0].name;
  const sourcePath = pathModule.join(distDir, newestArtifactName);

  if (sourcePath === destinationPath) {
    return;
  }

  const hadDestination = fsModule.existsSync(destinationPath);

  if (fsModule.existsSync(backupDestinationPath)) {
    fsModule.rmSync(backupDestinationPath, { force: true });
  }

  try {
    if (hadDestination) {
      fsModule.renameSync(destinationPath, backupDestinationPath);
    }

    fsModule.renameSync(sourcePath, destinationPath);

    if (fsModule.existsSync(backupDestinationPath)) {
      fsModule.rmSync(backupDestinationPath, { force: true });
    }
  } catch (error) {
    if (fsModule.existsSync(destinationPath)) {
      fsModule.rmSync(destinationPath, { force: true });
    }

    if (!fsModule.existsSync(destinationPath) && fsModule.existsSync(backupDestinationPath)) {
      fsModule.renameSync(backupDestinationPath, destinationPath);
    }

    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  normalizePackedPluginArtifact();
}
