import WebSocket from "ws";
import { fetchUvLocations, resolveUvForLocation } from "./uv-data.js";

const REFRESH_MINUTES_TO_MS = {
  "5": 5 * 60 * 1000,
  "10": 10 * 60 * 1000,
  "30": 30 * 60 * 1000,
  "60": 60 * 60 * 1000,
};

const state = {
  ws: null,
  actionUuid: null,
  pluginUuid: null,
  contexts: new Map(),
  contextVersions: new Map(),
  intervals: new Map(),
  inFlightRefreshes: new Map(),
  locationsCache: null,
  inFlightLocationsRequest: null,
};

let fetchUvLocationsImpl = fetchUvLocations;
let resolveUvForLocationImpl = resolveUvForLocation;

function send(event, payload = {}) {
  if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
    return;
  }

  state.ws.send(JSON.stringify({ event, ...payload }));
}

function setTitle(context, title) {
  send("setTitle", { context, payload: { title, target: 0 } });
}

function setContextSettings(context, settings) {
  send("setSettings", { context, payload: settings });
}

function cacheLocations(locations) {
  state.locationsCache = locations;
}

async function getLocations({ forceRefetch = false } = {}) {
  if (!forceRefetch && state.locationsCache) {
    return state.locationsCache;
  }

  if (!forceRefetch && state.inFlightLocationsRequest) {
    return state.inFlightLocationsRequest;
  }

  const request = (async () => {
    const locations = await fetchUvLocationsImpl();
    cacheLocations(locations);
    return locations;
  })();

  state.inFlightLocationsRequest = request;

  try {
    return await request;
  } finally {
    if (state.inFlightLocationsRequest === request) {
      state.inFlightLocationsRequest = null;
    }
  }
}

function getContextVersion(context) {
  return state.contextVersions.get(context) ?? 0;
}

function canMutateContext(context, version) {
  return state.contexts.has(context) && getContextVersion(context) === version;
}

async function refreshContext(context, { forceRefetch = true } = {}) {
  const version = getContextVersion(context);
  const existingRefresh = state.inFlightRefreshes.get(context);
  if (existingRefresh && existingRefresh.version === version) {
    return existingRefresh.promise;
  }

  const refreshPromise = (async () => {
  const settings = state.contexts.get(context) ?? {};

  if (!settings.locationId) {
    if (canMutateContext(context, version)) {
      setTitle(context, "Set ID");
    }
    return undefined;
  }

  try {
    const locations = await getLocations({ forceRefetch });
    if (!canMutateContext(context, version)) {
      return undefined;
    }

    const uv = resolveUvForLocationImpl(locations, settings.locationId);

    if (!uv) {
      setTitle(context, "N/A");
      return undefined;
    }

    setTitle(context, `${uv.uv}`);

    if (settings.locationName !== uv.locationName && canMutateContext(context, version)) {
      setContextSettings(context, {
        ...settings,
        locationName: uv.locationName,
      });
      state.contexts.set(context, {
        ...settings,
        locationName: uv.locationName,
      });
    }
  } catch {
    if (canMutateContext(context, version)) {
      setTitle(context, "ERR");
    }
  } finally {
    const refreshEntry = state.inFlightRefreshes.get(context);
    if (refreshEntry?.promise === refreshPromise) {
      state.inFlightRefreshes.delete(context);
    }
  }
  })();

  state.inFlightRefreshes.set(context, { version, promise: refreshPromise });
  return refreshPromise;
}

function clearRefreshInterval(context) {
  const existing = state.intervals.get(context);
  if (existing) {
    clearInterval(existing);
    state.intervals.delete(context);
  }
}

function scheduleRefresh(context) {
  clearRefreshInterval(context);

  const settings = state.contexts.get(context) ?? {};
  const intervalMs = REFRESH_MINUTES_TO_MS[String(settings.refreshInterval ?? "")];

  if (!intervalMs) {
    return;
  }

  const timer = setInterval(() => {
    void refreshContext(context, { forceRefetch: true });
  }, intervalMs);

  state.intervals.set(context, timer);
}

async function sendLocationsToPropertyInspector(context) {
  const sendLocations = (locations) =>
    send("sendToPropertyInspector", {
      context,
      action: state.actionUuid,
      payload: {
        type: "locations",
        locations,
      },
    });

  if (state.locationsCache) {
    sendLocations(state.locationsCache);
    return;
  }

  try {
    const locations = await getLocations();
    sendLocations(locations);
  } catch {
    sendLocations([]);
  }
}

function upsertContext(context, settings) {
  state.contexts.set(context, {
    refreshInterval: "on-demand",
    ...state.contexts.get(context),
    ...settings,
  });
}

function markContextVisible(context) {
  state.contextVersions.set(context, getContextVersion(context) + 1);
}

function onMessage(rawMessage) {
  const message = JSON.parse(String(rawMessage));

  switch (message.event) {
    case "willAppear": {
      markContextVisible(message.context);
      upsertContext(message.context, message.payload.settings);
      scheduleRefresh(message.context);
      void refreshContext(message.context, { forceRefetch: true });
      break;
    }

    case "didReceiveSettings": {
      upsertContext(message.context, message.payload.settings);
      scheduleRefresh(message.context);
      void refreshContext(message.context, { forceRefetch: true });
      break;
    }

    case "keyDown": {
      void refreshContext(message.context, { forceRefetch: true });
      break;
    }

    case "willDisappear": {
      clearRefreshInterval(message.context);
      state.contexts.delete(message.context);
      state.contextVersions.delete(message.context);
      break;
    }

    case "propertyInspectorDidAppear": {
      sendLocationsToPropertyInspector(message.context);
      break;
    }

    case "sendToPlugin": {
      if (message.payload?.type === "requestLocations") {
        sendLocationsToPropertyInspector(message.context);
      }
      break;
    }

    default:
      break;
  }
}

export function setPluginTestDependencies({ fetchLocations, resolveLocation } = {}) {
  if (fetchLocations) {
    fetchUvLocationsImpl = fetchLocations;
  }

  if (resolveLocation) {
    resolveUvForLocationImpl = resolveLocation;
  }
}

export function resetPluginStateForTests() {
  for (const interval of state.intervals.values()) {
    clearInterval(interval);
  }

  state.ws = null;
  state.actionUuid = null;
  state.pluginUuid = null;
  state.contexts.clear();
  state.contextVersions.clear();
  state.intervals.clear();
  state.inFlightRefreshes.clear();
  state.locationsCache = null;
  state.inFlightLocationsRequest = null;
  fetchUvLocationsImpl = fetchUvLocations;
  resolveUvForLocationImpl = resolveUvForLocation;
}

export const __pluginTestApi = {
  state,
  onMessage,
  refreshContext,
};

function connectElgatoStreamDeckSocket(port, pluginUuid, registerEvent, info, actionInfo) {
  void info;

  const parsedActionInfo = JSON.parse(actionInfo);
  state.actionUuid = parsedActionInfo.action;
  state.pluginUuid = pluginUuid;

  const ws = new WebSocket(`ws://localhost:${port}`);
  state.ws = ws;

  ws.on("open", () => {
    send(registerEvent, { uuid: pluginUuid });
  });

  ws.on("message", onMessage);
}

globalThis.connectElgatoStreamDeckSocket = connectElgatoStreamDeckSocket;
