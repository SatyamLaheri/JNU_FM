/**
 * Client-side listener presence.
 * Server functions were removed to avoid TanStack Start CSRF middleware
 * issues on Vercel serverless. Count reflects active tabs on this device.
 */

const CLIENT_ID_KEY = "jnu_campus_listener_id";
const TAB_HEARTBEAT_KEY = "jnu_campus_tab_heartbeat";
const PRESENCE_TTL_MS = 45_000;

function getClientId() {
  if (typeof window === "undefined") return "server";
  const existing = localStorage.getItem(CLIENT_ID_KEY);
  if (existing) return existing;

  const clientId = crypto.randomUUID();
  localStorage.setItem(CLIENT_ID_KEY, clientId);
  return clientId;
}

function readActiveTabCount() {
  if (typeof window === "undefined") return 1;

  const now = Date.now();
  const raw = localStorage.getItem(TAB_HEARTBEAT_KEY);
  const heartbeats = raw ? (JSON.parse(raw) as Record<string, number>) : {};

  for (const [tabId, lastSeen] of Object.entries(heartbeats)) {
    if (now - lastSeen > PRESENCE_TTL_MS) {
      delete heartbeats[tabId];
    }
  }

  return Math.max(1, Object.keys(heartbeats).length);
}

function writeHeartbeat(tabId: string) {
  const now = Date.now();
  const raw = localStorage.getItem(TAB_HEARTBEAT_KEY);
  const heartbeats = raw ? (JSON.parse(raw) as Record<string, number>) : {};

  heartbeats[tabId] = now;

  for (const [id, lastSeen] of Object.entries(heartbeats)) {
    if (now - lastSeen > PRESENCE_TTL_MS) {
      delete heartbeats[id];
    }
  }

  localStorage.setItem(TAB_HEARTBEAT_KEY, JSON.stringify(heartbeats));
}

function removeHeartbeat(tabId: string) {
  const raw = localStorage.getItem(TAB_HEARTBEAT_KEY);
  if (!raw) return;

  const heartbeats = JSON.parse(raw) as Record<string, number>;
  delete heartbeats[tabId];
  localStorage.setItem(TAB_HEARTBEAT_KEY, JSON.stringify(heartbeats));
}

export function getLocalListenerCount() {
  getClientId();
  return readActiveTabCount();
}

export function startLocalPresence(tabId: string, onUpdate: (count: number) => void) {
  const refresh = () => {
    writeHeartbeat(tabId);
    onUpdate(readActiveTabCount());
  };

  refresh();
  const interval = window.setInterval(refresh, 20_000);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === TAB_HEARTBEAT_KEY) {
      onUpdate(readActiveTabCount());
    }
  };

  window.addEventListener("storage", handleStorage);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      refresh();
    }
  });

  return () => {
    window.clearInterval(interval);
    window.removeEventListener("storage", handleStorage);
    removeHeartbeat(tabId);
    onUpdate(readActiveTabCount());
  };
}
