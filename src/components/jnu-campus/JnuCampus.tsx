import { CampusBackground } from "./CampusBackground";
import { Clock } from "./Clock";
import { CampusPlayer } from "./CampusPlayer";
import { CampusTitle } from "./CampusTitle";
import { InstagramHandle } from "./InstagramHandle";
import { SharePill } from "./SharePill";

const playerDockClass =
  "fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-20 -translate-x-1/2 sm:left-6 sm:translate-x-0";
const shareDockClass =
  "fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-20 sm:right-6";

export function JnuCampus() {
  return (
    <main className="relative min-h-svh w-full overflow-hidden bg-black select-none">
      <CampusBackground />

      <div
        className="pointer-events-none fixed inset-0 z-1 bg-linear-to-b from-black/40 via-transparent to-black/55"
        aria-hidden="true"
      />

      <header className="relative z-10 flex items-start justify-between gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pt-6">
        <div className="shrink-0">
          <Clock />
        </div>

        <div className="pointer-events-none absolute left-1/2 top-[max(1rem,env(safe-area-inset-top))] hidden w-full max-w-xl -translate-x-1/2 sm:block sm:top-6">
          <CampusTitle />
        </div>

        <div className="shrink-0">
          <InstagramHandle />
        </div>
      </header>

      <div className="relative z-10 mt-3 px-4 sm:hidden">
        <CampusTitle />
      </div>

      <div className={playerDockClass}>
        <CampusPlayer />
      </div>

      <div className={shareDockClass}>
        <SharePill />
      </div>
    </main>
  );
}
