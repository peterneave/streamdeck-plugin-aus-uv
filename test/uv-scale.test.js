import test from "node:test";
import assert from "node:assert/strict";
import {
  buildUvKeyImage,
  buildUvKeySvg,
  getUvCategory,
} from "../com.peterneave.streamdeck-plugin-au-uv.sdPlugin/uv-scale.js";

test("getUvCategory maps values to the UV scale bands", () => {
  const cases = [
    [0, "Low", "#d4f2bc"],
    [2.4, "Low", "#d4f2bc"],
    [2.5, "Moderate", "#f9f5c2"],
    [5.4, "Moderate", "#f9f5c2"],
    [5.5, "High", "#fde1bf"],
    [7.4, "High", "#fde1bf"],
    [7.5, "Very High", "#f2b8bf"],
    [10.4, "Very High", "#f2b8bf"],
    [10.5, "Extreme", "#e0dbf9"],
    [16, "Extreme", "#e0dbf9"],
  ];

  for (const [uv, label, colour] of cases) {
    const category = getUvCategory(uv);
    assert.equal(category.label, label, `uv ${uv}`);
    assert.equal(category.colour, colour, `uv ${uv}`);
  }
});

test("getUvCategory treats negative or invalid values as Low", () => {
  assert.equal(getUvCategory(-1).label, "Low");
  assert.equal(getUvCategory(Number.NaN).label, "Low");
});

test("buildUvKeySvg includes background colour, value and label", () => {
  const svg = buildUvKeySvg(8.2);
  assert.match(svg, /fill="#f2b8bf"/);
  assert.match(svg, />8\.2</);
  assert.match(svg, />Very High</);
});

test("buildUvKeyImage returns a base64 SVG data URL", () => {
  const image = buildUvKeyImage(3);
  const prefix = "data:image/svg+xml;base64,";
  assert.ok(image.startsWith(prefix));
  const decoded = Buffer.from(image.slice(prefix.length), "base64").toString();
  assert.equal(decoded, buildUvKeySvg(3));
});
