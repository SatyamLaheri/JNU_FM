import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronUp, Loader2, Pause, Play, Radio, SkipForward } from "lucide-react";
import { getWingOption } from "@/data/campus-playlists";
import { useCampusPlayer } from "@/hooks/useCampusPlayer";

export function CampusPlayer() {
  const progressRef = useRef<HTMLDivElement>(null);
  const wingMenuRef = useRef<HTMLDivElement>(null);
  const [wingMenuOpen, setWingMenuOpen] = useState(false);

  const {
    wingOptions,
    wingPreference,
    selectWingPreference,
    isPlaying,
    isLoading,
    elapsed,
    duration,
    progress,
    formatTime,
    togglePlay,
    goNext,
    seekTo,
    hasTracks,
  } = useCampusPlayer();

  const activeWing = getWingOption(wingPreference);

  useEffect(() => {
    if (!wingMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!wingMenuRef.current?.contains(event.target as Node)) {
        setWingMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [wingMenuOpen]);

  const handleWingSelect = useCallback(
    (wing: typeof wingPreference) => {
      selectWingPreference(wing);
      setWingMenuOpen(false);
    },
    [selectWingPreference],
  );

  const seekFromPointer = useCallback(
    (clientX: number) => {
      const bar = progressRef.current;
      if (!bar || duration <= 0) return;

      const rect = bar.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      seekTo(ratio);
    },
    [duration, seekTo],
  );

  const handleProgressClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      seekFromPointer(event.clientX);
    },
    [seekFromPointer],
  );

  const handleProgressKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (duration <= 0) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        seekTo((elapsed + 5) / duration);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        seekTo((elapsed - 5) / duration);
      }
    },
    [duration, elapsed, seekTo],
  );

  return (
    <div ref={wingMenuRef} className="relative flex flex-col items-center">
      {wingMenuOpen ? (
        <div
          className="glass-panel absolute bottom-[calc(100%+0.5rem)] left-1/2 z-30 w-[min(100vw-2rem,18rem)] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/15 p-1 shadow-2xl sm:w-80"
          role="menu"
          aria-label="विचारधारा चुनें"
        >
          {wingOptions.map((option) => {
            const isActive = wingPreference === option.id;

            return (
              <button
                key={option.id}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => handleWingSelect(option.id)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-all ${
                  isActive
                    ? "bg-white/18 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    isActive ? "bg-online" : "bg-white/25"
                  }`}
                  aria-hidden="true"
                />
                <span className="text-[0.72rem] font-medium leading-snug sm:text-[0.78rem]">
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div
        className="glass-panel flex w-auto items-center gap-2 rounded-full border border-white/15 px-2.5 py-2 shadow-2xl sm:gap-3 sm:px-4 sm:py-2.5 lg:gap-4 lg:px-5"
        role="region"
        aria-label="Campus radio player"
      >
        <button
          type="button"
          onClick={() => setWingMenuOpen((open) => !open)}
          aria-label={`विचारधारा: ${activeWing.label}`}
          aria-expanded={wingMenuOpen}
          aria-haspopup="menu"
          className={`flex h-9 shrink-0 items-center justify-center gap-1 rounded-full px-2 text-white/75 transition-all hover:bg-white/10 hover:text-white sm:h-10 sm:px-2.5 ${
            wingMenuOpen ? "bg-white/15 text-white" : ""
          }`}
        >
          <Radio className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
          <span className="max-w-14 truncate text-[0.58rem] font-semibold sm:max-w-none sm:text-[0.62rem]">
            {activeWing.shortLabel}
          </span>
          <ChevronUp
            className={`h-3 w-3 shrink-0 transition-transform sm:h-3.5 sm:w-3.5 ${
              wingMenuOpen ? "rotate-0" : "rotate-180"
            }`}
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          aria-label="Next track"
          onClick={goNext}
          disabled={!hasTracks}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40 sm:h-10 sm:w-10"
        >
          <SkipForward className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
        </button>

        <button
          type="button"
          aria-label={isPlaying ? "Pause" : "Play"}
          onClick={togglePlay}
          disabled={!hasTracks}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition-all hover:bg-white/25 active:scale-95 disabled:opacity-40 sm:h-10 sm:w-10"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin sm:h-4.5 sm:w-4.5" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4 fill-current sm:h-4.5 sm:w-4.5" />
          ) : (
            <Play className="h-4 w-4 fill-current ml-0.5 sm:h-4.5 sm:w-4.5" />
          )}
        </button>

        <div className="w-20 sm:w-44 lg:w-64">
          <div
            ref={progressRef}
            role="slider"
            tabIndex={0}
            aria-label="Seek track"
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={elapsed}
            aria-disabled={!hasTracks || duration <= 0}
            onClick={handleProgressClick}
            onKeyDown={handleProgressKeyDown}
            className="group relative h-2 cursor-pointer rounded-full bg-white/15 py-1"
          >
            <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/10">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-white/80 transition-[width] duration-150 ease-linear group-hover:bg-white"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <p className="mt-1 text-center text-[0.58rem] font-medium tabular-nums text-white/45 sm:text-[0.62rem]">
            <span>{formatTime(elapsed)}</span>
            <span className="hidden sm:inline text-white/30"> / {formatTime(duration)}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
