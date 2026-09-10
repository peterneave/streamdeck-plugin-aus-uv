import test from "node:test";
import assert from "node:assert/strict";
import {
  __pluginTestApi,
  resetPluginStateForTests,
  setPluginTestDependencies,
} from "../com.peterneave.streamdeck-plugin-au-uv.sdPlugin/plugin.js";

const { state, refreshContext, onMessage } = __pluginTestApi;

function createSendRecorder() {
  const messages = [];
  state.ws = {
    readyState: 1,
    send(payload) {
      messages.push(JSON.parse(payload));
    },
  };

  return messages;
}

function titles(messages) {
  return messages.filter((entry) => entry.event === "setTitle").map((entry) => entry.payload.title);
}

test.beforeEach(() => {
  resetPluginStateForTests();
});

test.afterEach(() => {
  resetPluginStateForTests();
});

test("refreshContext shows Set ID when location is missing", async () => {
  const messages = createSendRecorder();
  state.contexts.set("ctx", {});

  await refreshContext("ctx", { forceRefetch: true });

  assert.deepEqual(titles(messages), ["Set ID"]);
});

test("refreshContext shows N/A when location ID does not exist", async () => {
  const messages = createSendRecorder();
  setPluginTestDependencies({
    fetchLocations: async () => [{ locationId: "1", locationName: "Melbourne", uv: 5 }],
  });
  state.contexts.set("ctx", { locationId: "2" });

  await refreshContext("ctx", { forceRefetch: true });

  assert.deepEqual(titles(messages), ["N/A"]);
});

test("refreshContext shows ERR when UV fetch fails", async () => {
  const messages = createSendRecorder();
  setPluginTestDependencies({
    fetchLocations: async () => {
      throw new Error("network error");
    },
  });
  state.contexts.set("ctx", { locationId: "2" });

  await refreshContext("ctx", { forceRefetch: true });

  assert.deepEqual(titles(messages), ["ERR"]);
});

test("refreshContext reuses in-flight fetch per context", async () => {
  let fetchCount = 0;
  setPluginTestDependencies({
    fetchLocations: async () => {
      fetchCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return [{ locationId: "1", locationName: "Melbourne", uv: 5 }];
    },
  });

  createSendRecorder();
  state.contexts.set("ctx", { locationId: "1" });

  const first = refreshContext("ctx", { forceRefetch: true });
  const second = refreshContext("ctx", { forceRefetch: true });

  await Promise.all([first, second]);
  assert.equal(fetchCount, 1);
});

test("location list requests use cached values after first fetch", async () => {
  let fetchCount = 0;
  setPluginTestDependencies({
    fetchLocations: async () => {
      fetchCount += 1;
      return [{ locationId: "100", locationName: "Sydney", uv: 7 }];
    },
  });

  const messages = createSendRecorder();
  state.actionUuid = "com.peterneave.streamdeck-plugin-au-uv.action";

  onMessage(
    JSON.stringify({
      event: "sendToPlugin",
      context: "ctx",
      payload: { type: "requestLocations" },
    }),
  );
  await new Promise((resolve) => setImmediate(resolve));

  onMessage(
    JSON.stringify({
      event: "sendToPlugin",
      context: "ctx",
      payload: { type: "requestLocations" },
    }),
  );
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(fetchCount, 1);
  const locationPayloads = messages
    .filter((entry) => entry.event === "sendToPropertyInspector")
    .map((entry) => entry.payload.locations);
  assert.equal(locationPayloads.length, 2);
  assert.deepEqual(locationPayloads[0], locationPayloads[1]);
});

test("concurrent location list requests share in-flight fetch", async () => {
  let resolveFetch;
  let fetchCount = 0;
  setPluginTestDependencies({
    fetchLocations: async () => {
      fetchCount += 1;
      return new Promise((resolve) => {
        resolveFetch = resolve;
      });
    },
  });

  createSendRecorder();
  state.actionUuid = "com.peterneave.streamdeck-plugin-au-uv.action";

  onMessage(
    JSON.stringify({
      event: "sendToPlugin",
      context: "ctx",
      payload: { type: "requestLocations" },
    }),
  );
  onMessage(
    JSON.stringify({
      event: "sendToPlugin",
      context: "ctx",
      payload: { type: "requestLocations" },
    }),
  );

  assert.equal(fetchCount, 1);
  resolveFetch([{ locationId: "100", locationName: "Sydney", uv: 7 }]);
  await new Promise((resolve) => setImmediate(resolve));
});

test("didReceiveSettings reuses cache when location ID is unchanged", async () => {
  createSendRecorder();
  state.contexts.set("ctx", { locationId: "1", refreshInterval: "5" });
  state.contextVersions.set("ctx", 1);
  state.locationsCache = [{ locationId: "1", locationName: "Melbourne", uv: 5 }];

  let fetchCount = 0;
  setPluginTestDependencies({
    fetchLocations: async () => {
      fetchCount += 1;
      return [];
    },
  });

  onMessage(
    JSON.stringify({
      event: "didReceiveSettings",
      context: "ctx",
      payload: { settings: { locationId: "1", refreshInterval: "10" } },
    }),
  );

  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(fetchCount, 0);
});
