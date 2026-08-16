import { Clock } from "./Clock";
import { CampusPlayer } from "./CampusPlayer";
import { CampusTitle } from "./CampusTitle";
import { SharePill } from "./SharePill";

const playerDockClass =
  "fixed bottom-18 left-4 z-20 w-[calc(100%-2rem)] max-w-95 sm:bottom-16 sm:left-6";
const shareDockClass = "fixed bottom-18 right-4 z-20 sm:bottom-16 sm:right-6";

export function JnuCampus() {
  return (
    <main className="relative min-h-svh w-full overflow-hidden bg-black select-none">
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/jnu-campus-bg.png')" }}
        role="img"
        aria-label="JNU campus hostel street at dusk with brick buildings, graffiti, bus, and dhaba"
      />

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

      <footer className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-center border-t border-white/10 bg-black/30 px-4 py-3 text-[0.68rem] font-medium text-white/45 backdrop-blur-sm sm:px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <p className="text-center">
          Crafted for the JNU campus community <span aria-label="love">❤️</span>
        </p>
      </footer>
    </main>
  );
}
