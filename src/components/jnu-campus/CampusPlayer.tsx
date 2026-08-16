import { useCallback, useRef } from "react";
import { Loader2, Pause, Play, SkipForward } from "lucide-react";
import { useCampusPlayer } from "@/hooks/useCampusPlayer";

export function CampusPlayer() {
  const progressRef = useRef<HTMLDivElement>(null);
  const {
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
    <div
      className="glass-panel flex w-auto items-center gap-2 rounded-full border border-white/15 px-2.5 py-2 shadow-2xl sm:gap-3 sm:px-4 sm:py-2.5 lg:gap-4 lg:px-5"
      role="region"
      aria-label="Campus radio player"
    >
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
  );
}
