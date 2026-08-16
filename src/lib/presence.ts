import { createServerFn } from "@tanstack/react-start";

const PRESENCE_TTL_MS = 45_000;

type PresenceStore = Map<string, number>;

function getPresenceStore(): PresenceStore {
  const globalStore = globalThis as typeof globalThis & {
    __jnuCampusPresence?: PresenceStore;
  };

  if (!globalStore.__jnuCampusPresence) {
    globalStore.__jnuCampusPresence = new Map();
  }

  return globalStore.__jnuCampusPresence;
}

function prunePresenceStore(store: PresenceStore) {
  const now = Date.now();

  for (const [clientId, lastSeen] of store) {
    if (now - lastSeen > PRESENCE_TTL_MS) {
      store.delete(clientId);
    }
  }
}

export const pingPresence = createServerFn({ method: "POST" })
  .validator((data: { clientId: string }) => data)
  .handler(async ({ data }) => {
    const store = getPresenceStore();
    store.set(data.clientId, Date.now());
    prunePresenceStore(store);

    return { onlineCount: Math.max(1, store.size) };
  });

export const getPresenceCount = createServerFn({ method: "GET" }).handler(
  async () => {
    const store = getPresenceStore();
    prunePresenceStore(store);

    return { onlineCount: Math.max(1, store.size) };
  },
);
