import { useCallback, useEffect, useRef, useState } from "react";
import {
  campusPlaylists,
  defaultPlaylistType,
  getPlaylistByType,
  type CampusTrack,
  type PlaylistType,
} from "@/data/campus-playlists";

const STORAGE_PLAYLIST_KEY = "jnu_campus_playlist_type";

function readStoredPlaylistType(): PlaylistType {
  if (typeof window === "undefined") return defaultPlaylistType;
  try {
    const stored = localStorage.getItem(STORAGE_PLAYLIST_KEY);
    if (stored === "political" || stored === "campus") {
      const target = getPlaylistByType(stored);
      if (!target.comingSoon && target.tracks.length > 0) return stored;
    }
  } catch {
    // ignore
  }
  return defaultPlaylistType;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function prefetchAudio(url: string) {
  if (typeof window === "undefined") return;
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.as = "fetch";
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
  const tracksRef = useRef<CampusTrack[]>([]);
  const trackIndexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const isShuffleRef = useRef(false);

  const [playlistType, setPlaylistType] = useState<PlaylistType>(readStoredPlaylistType);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const playlist = getPlaylistByType(playlistType);
  const tracks = playlist.tracks;

  tracksRef.current = tracks;
  trackIndexRef.current = trackIndex;
  isPlayingRef.current = isPlaying;
  isShuffleRef.current = isShuffle;

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
    async (index: number, autoplay = false) => {
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

      if (audio.src !== track.audio) {
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
    const nextIndex = isShuffleRef.current
      ? Math.floor(Math.random() * list.length)
      : (current + 1) % list.length;
    void loadTrack(nextIndex, isPlayingRef.current);
  }, [loadTrack]);

  goNextRef.current = goNext;

  const goPrev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    const list = tracksRef.current;
    if (!list.length) return;
    void loadTrack(trackIndexRef.current - 1, isPlayingRef.current);
  }, [loadTrack]);

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

  const selectPlaylistType = useCallback(
    (type: PlaylistType) => {
      const target = campusPlaylists.find((p) => p.id === type);
      if (!target || target.comingSoon || target.tracks.length === 0) return;

      setPlaylistType(type);
      setTrackIndex(0);
      setElapsed(0);
      setDuration(0);
      setIsPlaying(false);
      preloadCacheRef.current.clear();

      try {
        localStorage.setItem(STORAGE_PLAYLIST_KEY, type);
      } catch {
        // ignore
      }

      tracksRef.current = target.tracks;
      void loadTrack(0, false);
    },
    [loadTrack],
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
    void loadTrack(0, false);
  }, [playlistType, loadTrack]);

  const progress = duration > 0 ? (elapsed / duration) * 100 : 0;

  return {
    playlistOptions: campusPlaylists,
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
    hasTracks: tracks.length > 0,
  };
}
