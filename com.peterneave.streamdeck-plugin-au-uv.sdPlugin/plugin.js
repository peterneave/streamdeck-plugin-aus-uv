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
  intervals: new Map(),
};

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

async function refreshContext(context) {
  const settings = state.contexts.get(context) ?? {};

  if (!settings.locationId) {
    setTitle(context, "Set ID");
    return;
  }

  try {
    const locations = await fetchUvLocations();
    const uv = resolveUvForLocation(locations, settings.locationId);

    if (!uv) {
      setTitle(context, "N/A");
      return;
    }

    setTitle(context, `${uv.uv}`);

    if (settings.locationName !== uv.locationName) {
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
    setTitle(context, "ERR");
  }
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
    refreshContext(context);
  }, intervalMs);

  state.intervals.set(context, timer);
}

async function sendLocationsToPropertyInspector(context) {
  try {
    const locations = await fetchUvLocations();
    send("sendToPropertyInspector", {
      context,
      action: state.actionUuid,
      payload: {
        type: "locations",
        locations,
      },
    });
  } catch {
    send("sendToPropertyInspector", {
      context,
      action: state.actionUuid,
      payload: {
        type: "locations",
        locations: [],
      },
    });
  }
}

function upsertContext(context, settings) {
  state.contexts.set(context, {
    refreshInterval: "on-demand",
    ...state.contexts.get(context),
    ...settings,
  });
}

function onMessage(rawMessage) {
  const message = JSON.parse(String(rawMessage));

  switch (message.event) {
    case "willAppear": {
      upsertContext(message.context, message.payload.settings);
      scheduleRefresh(message.context);
      refreshContext(message.context);
      break;
    }

    case "didReceiveSettings": {
      upsertContext(message.context, message.payload.settings);
      scheduleRefresh(message.context);
      refreshContext(message.context);
      break;
    }

    case "keyDown": {
      refreshContext(message.context);
      break;
    }

    case "willDisappear": {
      clearRefreshInterval(message.context);
      state.contexts.delete(message.context);
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
