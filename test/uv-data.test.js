import test from "node:test";
import assert from "node:assert/strict";
import { parseLocationsFromXml, resolveUvForLocation } from "../com.peterneave.streamdeck-plugin-au-uv.sdPlugin/uv-data.js";

test("parseLocationsFromXml extracts locations and UV values", () => {
  const xml = `
    <uvdata>
      <location id="Adelaide">
        <name>adl</name>
        <uv>6</uv>
      </location>
      <location id="Sydney">
        <name>syd</name>
        <uvValue>8</uvValue>
      </location>
    </uvdata>
  `;

  const locations = parseLocationsFromXml(xml);

  // The ARPANSA feed uses the city as the id and a short code as the name,
  // so the display name should be the city.
  assert.deepEqual(locations, [
    { locationId: "Adelaide", locationName: "Adelaide", uv: 6 },
    { locationId: "Sydney", locationName: "Sydney", uv: 8 },
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

test("resolveUvForLocation returns selected location", () => {
  const locations = [
    { locationId: "1", locationName: "Melbourne", uv: 5 },
    { locationId: "2", locationName: "Perth", uv: 9 },
  ];
  const result = resolveUvForLocation(locations, "2");
  assert.deepEqual(result, { locationId: "2", locationName: "Perth", uv: 9 });
});

test("parseLocationsFromXml ignores records with non-numeric UV values", () => {
  const xml = `
    <uvdata>
      <location id="Adelaide">
        <name>adl</name>
        <uv>6</uv>
      </location>
      <location id="Sydney">
        <name>syd</name>
        <uv>n/a</uv>
      </location>
      <location id="Brisbane">
        <name>bri</name>
      </location>
    </uvdata>
  `;

  const locations = parseLocationsFromXml(xml);
  assert.deepEqual(locations, [{ locationId: "Adelaide", locationName: "Adelaide", uv: 6 }]);
});
