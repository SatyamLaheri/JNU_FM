import { useCallback, useEffect, useRef, useState } from "react";
import {
  defaultWingPreference,
  getTracksForWing,
  wingOptions,
  type CampusTrack,
  type WingPreference,
} from "@/data/campus-playlists";

const STORAGE_WING_KEY = "jnu_campus_wing_preference";

function readStoredWingPreference(): WingPreference {
  if (typeof window === "undefined") return defaultWingPreference;

  try {
    const stored = localStorage.getItem(STORAGE_WING_KEY);
    if (stored === "neutral" || stored === "left" || stored === "right") {
      return stored;
    }
  } catch {
    // ignore
  }

  return defaultWingPreference;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function resolveAudioSrc(trackUrl: string) {
  if (typeof window === "undefined") return trackUrl;
  return new URL(trackUrl, window.location.origin).href;
}

function prefetchAudio(url: string) {
  if (typeof window === "undefined") return;
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.as = "audio";
  link.href = url;
  document.head.appendChild(link);
}

function waitUntilPlayable(audio: HTMLAudioElement) {
  if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Audio failed to load"));
    };
    const cleanup = () => {
      audio.removeEventListener("canplay", onReady);
      audio.removeEventListener("error", onError);
    };

    audio.addEventListener("canplay", onReady);
    audio.addEventListener("error", onError);
  });
}

export function useCampusPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadCacheRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const tracksRef = useRef<CampusTrack[]>(getTracksForWing(readStoredWingPreference()));
  const trackIndexRef = useRef(0);
  const isPlayingRef = useRef(false);

  const [wingPreference, setWingPreference] = useState<WingPreference>(readStoredWingPreference);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const tracks = getTracksForWing(wingPreference);

  tracksRef.current = tracks;
  trackIndexRef.current = trackIndex;
  isPlayingRef.current = isPlaying;

  const warmCache = useCallback((track: CampusTrack) => {
    if (!track.audio || preloadCacheRef.current.has(track.audio)) return;
    const warm = new Audio();
    warm.preload = "auto";
    warm.src = track.audio;
    warm.load();
    preloadCacheRef.current.set(track.audio, warm);
  }, []);

  const prefetchNeighbors = useCallback(
    (index: number) => {
      const list = tracksRef.current;
      if (!list.length) return;
      warmCache(list[index]!);
      warmCache(list[(index + 1) % list.length]!);
      warmCache(list[(index - 1 + list.length) % list.length]!);
      prefetchAudio(list[(index + 1) % list.length]!.audio);
    },
    [warmCache],
  );

  const loadTrack = useCallback(
    async (index: number, autoplay = false, attempted = 0) => {
      const list = tracksRef.current;
      if (!list.length) return;

      const safeIndex = ((index % list.length) + list.length) % list.length;
      const track = list[safeIndex];
      if (!track) return;

      const audio = audioRef.current;
      if (!audio) return;

      setTrackIndex(safeIndex);
      setElapsed(0);
      setIsLoading(true);

      const nextSrc = resolveAudioSrc(track.audio);
      if (audio.src !== nextSrc) {
        audio.src = track.audio;
        audio.load();
      }

      prefetchNeighbors(safeIndex);

      try {
        await waitUntilPlayable(audio);
        setDuration(audio.duration || 0);
        if (autoplay) {
          await audio.play();
        }
      } catch {
        setIsPlaying(false);
        if (attempted < list.length - 1 && autoplay) {
          void loadTrack(safeIndex + 1, true, attempted + 1);
          return;
        }
      } finally {
        setIsLoading(false);
      }
    },
    [prefetchNeighbors],
  );

  const goNextRef = useRef<() => void>(() => {});

  const goNext = useCallback(() => {
    const list = tracksRef.current;
    if (!list.length) return;
    const current = trackIndexRef.current;
    const nextIndex = (current + 1) % list.length;
    void loadTrack(nextIndex, isPlayingRef.current);
  }, [loadTrack]);

  goNextRef.current = goNext;

  const seekTo = useCallback((ratio: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;

    const clamped = Math.min(Math.max(ratio, 0), 1);
    const nextTime = clamped * audio.duration;
    audio.currentTime = nextTime;
    setElapsed(nextTime);
  }, []);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    const list = tracksRef.current;
    if (!audio || !list.length) return;

    if (!audio.paused) {
      audio.pause();
      return;
    }

    setIsLoading(true);
    try {
      if (!audio.src) {
        await loadTrack(trackIndexRef.current, true);
        return;
      }
      await waitUntilPlayable(audio);
      await audio.play();
    } catch {
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [loadTrack]);

  const selectWingPreference = useCallback(
    (wing: WingPreference) => {
      if (wing === wingPreference) return;

      const nextTracks = getTracksForWing(wing);
      if (!nextTracks.length) return;

      setWingPreference(wing);
      setTrackIndex(0);
      setElapsed(0);
      setDuration(0);
      preloadCacheRef.current.clear();

      try {
        localStorage.setItem(STORAGE_WING_KEY, wing);
      } catch {
        // ignore
      }
    },
    [wingPreference],
  );

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setElapsed(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => setIsLoading(false);
    const onCanPlay = () => setIsLoading(false);
    const onEnded = () => goNextRef.current();

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("ended", onEnded);
      preloadCacheRef.current.clear();
    };
  }, []);

  useEffect(() => {
    tracksRef.current = getTracksForWing(wingPreference);
    void loadTrack(0, isPlayingRef.current);
  }, [wingPreference, loadTrack]);

  const progress = duration > 0 ? (elapsed / duration) * 100 : 0;

  return {
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
    hasTracks: tracks.length > 0,
  };
}
