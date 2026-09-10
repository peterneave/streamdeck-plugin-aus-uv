import { XMLParser } from "fast-xml-parser";

export const UV_SOURCE_URL = "https://uvdata.arpansa.gov.au/xml/uvvalues.xml";

const parser = new XMLParser({
  attributeNamePrefix: "",
  ignoreAttributes: false,
  parseNodeValue: true,
  trimValues: true,
});

function toArray(value) {
  if (value == null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function readAny(obj, keys) {
  for (const key of keys) {
    if (obj[key] != null) {
      return obj[key];
    }
  }

  return undefined;
}

function normalizeRecord(record) {
  const locationId = String(
    readAny(record, ["id", "locationId", "locationid", "stationId", "stationid", "siteId", "siteid"]),
  ).trim();

  if (!locationId || locationId === "undefined") {
    return null;
  }

  const uvRaw = readAny(record, ["uv", "uvValue", "uvvalue", "value", "index", "currentUv", "currentUV"]);
  const uv = Number(uvRaw);

  if (!Number.isFinite(uv)) {
    return null;
  }

  const locationName = String(
    readAny(record, ["name", "location", "station", "city", "description", "title"]) ?? locationId,
  ).trim();

  return {
    locationId,
    locationName,
    uv,
  };
}

function traverse(input, results) {
  if (!input || typeof input !== "object") {
    return;
  }

  const normalized = normalizeRecord(input);
  if (normalized) {
    results.push(normalized);
  }

  for (const value of Object.values(input)) {
    for (const item of toArray(value)) {
      traverse(item, results);
    }
  }
}

export function parseLocationsFromXml(xmlText) {
  const parsed = parser.parse(xmlText);
  const records = [];

  traverse(parsed, records);

  const deduped = new Map();
  for (const record of records) {
    deduped.set(record.locationId, record);
  }

  return [...deduped.values()].sort((a, b) => a.locationName.localeCompare(b.locationName));
}

export async function fetchUvLocations(fetchImpl = fetch) {
  const response = await fetchImpl(UV_SOURCE_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`UV data fetch failed with status ${response.status}`);
  }

  const xmlText = await response.text();
  return parseLocationsFromXml(xmlText);
}

export function resolveUvForLocation(locations, locationId) {
  const id = String(locationId ?? "").trim();
  if (!id) {
    return null;
  }

  return locations.find((entry) => entry.locationId === id) ?? null;
}
