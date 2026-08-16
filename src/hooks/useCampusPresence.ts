import { useEffect, useState } from "react";
import { startLocalPresence } from "@/lib/presence";

export function useCampusPresence() {
  const [listeningCount, setListeningCount] = useState<number | null>(null);

  useEffect(() => {
    const tabId = crypto.randomUUID();
    return startLocalPresence(tabId, setListeningCount);
  }, []);

  return listeningCount;
}
