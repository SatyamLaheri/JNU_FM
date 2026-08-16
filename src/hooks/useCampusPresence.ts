import { useEffect, useState } from "react";
import { getPresenceCount, pingPresence } from "@/lib/presence";

const CLIENT_ID_KEY = "jnu_campus_listener_id";
const PING_INTERVAL_MS = 20_000;

function getClientId() {
  const existing = localStorage.getItem(CLIENT_ID_KEY);
  if (existing) return existing;

  const clientId = crypto.randomUUID();
  localStorage.setItem(CLIENT_ID_KEY, clientId);
  return clientId;
}

export function useCampusPresence() {
  const [listeningCount, setListeningCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const clientId = getClientId();

    const refreshCount = async () => {
      try {
        const { onlineCount } = await pingPresence({ data: { clientId } });
        if (!cancelled) setListeningCount(onlineCount);
      } catch {
        try {
          const { onlineCount } = await getPresenceCount();
          if (!cancelled) setListeningCount(onlineCount);
        } catch {
          if (!cancelled) {
            setListeningCount((current) => current ?? 1);
          }
        }
      }
    };

    void refreshCount();
    const interval = window.setInterval(() => {
      void refreshCount();
    }, PING_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshCount();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return listeningCount;
}
