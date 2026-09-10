import test from "node:test";
import assert from "node:assert/strict";
import { parseLocationsFromXml, resolveUvForLocation } from "../com.peterneave.streamdeck-plugin-au-uv.sdPlugin/uv-data.js";

test("parseLocationsFromXml extracts locations and UV values", () => {
  const xml = `
    <uvdata>
      <location id="AUS001">
        <name>Adelaide</name>
        <uv>6</uv>
      </location>
      <location id="AUS002">
        <name>Sydney</name>
        <uvValue>8</uvValue>
      </location>
    </uvdata>
  `;

  const locations = parseLocationsFromXml(xml);

  assert.deepEqual(locations, [
    { locationId: "AUS001", locationName: "Adelaide", uv: 6 },
    { locationId: "AUS002", locationName: "Sydney", uv: 8 },
  ]);
});

test("parseLocationsFromXml de-duplicates location IDs using latest data", () => {
  const xml = `
    <uvdata>
      <stations>
        <station>
          <locationId>001</locationId>
          <name>Brisbane</name>
          <value>7</value>
        </station>
        <station>
          <locationId>001</locationId>
          <name>Brisbane</name>
          <value>9</value>
        </station>
      </stations>
    </uvdata>
  `;

  const locations = parseLocationsFromXml(xml);

  assert.equal(locations.length, 1);
  assert.equal(locations[0].uv, 9);
});

test("resolveUvForLocation returns null if no location ID selected", () => {
  const result = resolveUvForLocation([{ locationId: "1", locationName: "Melbourne", uv: 5 }], "");
  assert.equal(result, null);
});
