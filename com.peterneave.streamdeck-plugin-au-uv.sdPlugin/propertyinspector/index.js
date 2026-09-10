const state = {
  ws: null,
  uuid: null,
  actionInfo: null,
  settings: {},
};

const locationSelect = document.getElementById("locationId");
const refreshIntervalSelect = document.getElementById("refreshInterval");
const status = document.getElementById("status");

function setStatus(text) {
  status.textContent = text;
}

function send(event, payload = {}) {
  if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
    return;
  }

  state.ws.send(JSON.stringify({ event, ...payload }));
}

function saveSettings() {
  const settings = {
    locationId: locationSelect.value,
    locationName: locationSelect.options[locationSelect.selectedIndex]?.text ?? "",
    refreshInterval: refreshIntervalSelect.value,
  };
  state.settings = settings;

  send("setSettings", {
    context: state.uuid,
    payload: settings,
  });
}

function renderLocationOptions(locations, selectedLocationId) {
  locationSelect.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select location";
  locationSelect.appendChild(defaultOption);

  for (const location of locations) {
    const option = document.createElement("option");
    option.value = location.locationId;
    option.textContent = `${location.locationName} (${location.locationId})`;
    locationSelect.appendChild(option);
  }

  locationSelect.value = selectedLocationId ?? "";
  setStatus(locations.length > 0 ? `${locations.length} locations loaded` : "No locations available");
}

function onMessage(rawMessage) {
  const message = JSON.parse(String(rawMessage.data));

  if (message.event === "didReceiveSettings") {
    const settings = message.payload.settings ?? {};
    state.settings = settings;
    refreshIntervalSelect.value = settings.refreshInterval ?? "on-demand";
    if (locationSelect.options.length > 0) {
      locationSelect.value = settings.locationId ?? "";
    }
    return;
  }

  if (message.event === "sendToPropertyInspector" && message.payload?.type === "locations") {
    const selectedLocationId = state.settings.locationId ?? (state.actionInfo.payload?.settings ?? {}).locationId;
    renderLocationOptions(message.payload.locations ?? [], selectedLocationId);
  }
}

function connectElgatoStreamDeckSocket(port, uuid, registerEvent, info, actionInfo) {
  void info;
  state.uuid = uuid;
  state.actionInfo = JSON.parse(actionInfo);
  state.settings = state.actionInfo.payload?.settings ?? {};

  const ws = new WebSocket(`ws://localhost:${port}`);
  state.ws = ws;

  ws.addEventListener("open", () => {
    setStatus("Loading locations...");
    send(registerEvent, { uuid });
    send("getSettings", { context: uuid });
    send("sendToPlugin", {
      context: uuid,
      action: state.actionInfo.action,
      payload: {
        type: "requestLocations",
      },
    });
  });

  ws.addEventListener("message", onMessage);
}

locationSelect.addEventListener("change", saveSettings);
refreshIntervalSelect.addEventListener("change", saveSettings);

globalThis.connectElgatoStreamDeckSocket = connectElgatoStreamDeckSocket;
