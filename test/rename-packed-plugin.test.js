import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { normalizePackedPluginArtifact } from '../scripts/rename-packed-plugin.mjs';

const expectedArtifactName = 'com.peterneave.streamdeck-plugin-au-uv.sdPlugin.streamDeckPlugin';
const generatedArtifactName = 'com.peterneave.streamdeck-plugin-au-uv.streamDeckPlugin';
const olderArtifactName = 'com.peterneave.streamdeck-plugin-au-uv-older.streamDeckPlugin';

function createTempDist() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'rename-packed-plugin-'));
}

function writeArtifact(distDir, name, contents, mtimeMs) {
  const filePath = path.join(distDir, name);
  fs.writeFileSync(filePath, contents);
  fs.utimesSync(filePath, new Date(mtimeMs), new Date(mtimeMs));
  return filePath;
}

test('normalizePackedPluginArtifact keeps the expected artifact when it already exists', () => {
  const distDir = createTempDist();
  writeArtifact(distDir, expectedArtifactName, 'stable', 1000);

  normalizePackedPluginArtifact({ distDir });

  assert.equal(fs.readFileSync(path.join(distDir, expectedArtifactName), 'utf8'), 'stable');
});

test('normalizePackedPluginArtifact renames the newest generated artifact to the expected filename', () => {
  const distDir = createTempDist();
  writeArtifact(distDir, expectedArtifactName, 'old-stable', 1000);
  writeArtifact(distDir, olderArtifactName, 'older-build', 1500);
  writeArtifact(distDir, generatedArtifactName, 'new-build', 2000);

  normalizePackedPluginArtifact({ distDir });

  assert.equal(fs.readFileSync(path.join(distDir, expectedArtifactName), 'utf8'), 'new-build');
  assert.equal(fs.existsSync(path.join(distDir, generatedArtifactName)), false);
});

test('normalizePackedPluginArtifact restores the previous artifact if replacement fails', () => {
  const distDir = createTempDist();
  const expectedPath = writeArtifact(distDir, expectedArtifactName, 'stable', 1000);
  const generatedPath = writeArtifact(distDir, generatedArtifactName, 'new-build', 2000);

  let replacementAttempted = false;
  const fsModule = {
    ...fs,
    renameSync(sourcePath, destinationPath) {
      if (sourcePath === expectedPath && destinationPath === `${expectedPath}.bak`) {
        return fs.renameSync(sourcePath, destinationPath);
      }

      if (sourcePath === generatedPath && destinationPath === expectedPath) {
        replacementAttempted = true;
        fs.writeFileSync(destinationPath, 'partial');
        throw new Error('rename failed');
      }

      return fs.renameSync(sourcePath, destinationPath);
    },
  };

  assert.throws(
    () => normalizePackedPluginArtifact({ distDir, fsModule }),
    /rename failed/,
  );

  assert.equal(replacementAttempted, true);
  assert.equal(fs.readFileSync(expectedPath, 'utf8'), 'stable');
  assert.equal(fs.existsSync(`${expectedPath}.bak`), false);
  assert.equal(fs.existsSync(generatedPath), true);
});
