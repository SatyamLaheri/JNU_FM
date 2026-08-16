import { Loader2, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useCampusPlayer } from "@/hooks/useCampusPlayer";

export function CampusPlayer() {
  const {
    playlistOptions,
    playlistType,
    selectPlaylistType,
    isPlaying,
    isLoading,
    elapsed,
    duration,
    progress,
    formatTime,
    togglePlay,
    goNext,
    goPrev,
    hasTracks,
  } = useCampusPlayer();

  return (
    <div
      className="glass-panel w-full max-w-95 rounded-2xl p-4 shadow-2xl"
      role="region"
      aria-label="Campus radio player"
    >
      <div className="mb-3 flex gap-1 rounded-full border border-white/15 bg-black/30 p-0.5">
        {playlistOptions.map((option) => {
          const isActive = playlistType === option.id;
          const isDisabled = option.comingSoon || option.tracks.length === 0;

          return (
            <button
              key={option.id}
              type="button"
              disabled={isDisabled}
              onClick={() => selectPlaylistType(option.id)}
              aria-pressed={isActive}
              aria-label={
                isDisabled
                  ? `${option.label} playlist coming soon`
                  : `Select ${option.label} playlist`
              }
              className={`flex flex-1 items-center justify-center gap-1 rounded-full px-2.5 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] transition-all ${
                isActive
                  ? "bg-white/20 text-white shadow-sm"
                  : isDisabled
                    ? "cursor-not-allowed text-white/30"
                    : "text-white/55 hover:bg-white/10 hover:text-white/80"
              }`}
            >
              <span>{option.label}</span>
              {option.comingSoon ? (
                <span className="rounded-full bg-white/10 px-1.5 py-px text-[0.5rem] font-bold normal-case tracking-normal text-white/45">
                  Soon
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-5">
        <button
          type="button"
          aria-label="Previous track"
          onClick={goPrev}
          disabled={!hasTracks}
          className="text-white/70 transition-colors hover:text-white disabled:opacity-40"
        >
          <SkipBack className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label={isPlaying ? "Pause" : "Play"}
          onClick={togglePlay}
          disabled={!hasTracks}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-all hover:bg-white/25 active:scale-95 disabled:opacity-40"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5 fill-current" />
          ) : (
            <Play className="h-5 w-5 fill-current ml-0.5" />
          )}
        </button>
        <button
          type="button"
          aria-label="Next track"
          onClick={goNext}
          disabled={!hasTracks}
          className="text-white/70 transition-colors hover:text-white disabled:opacity-40"
        >
          <SkipForward className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-3.5">
        <div className="relative h-1 overflow-hidden rounded-full bg-white/15">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white/80 transition-[width] duration-150 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[0.65rem] font-medium tabular-nums text-white/50">
          <span>{formatTime(elapsed)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
