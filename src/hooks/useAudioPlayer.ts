import { useCallback, useEffect, useRef, useState } from "react";
import type { Track } from "@/data/playlist";
import { setAmbientVolume, startAmbientBus, stopAmbientBus } from "@/lib/audioEffects";
import { extractID3Metadata, type ID3Metadata } from "@/lib/id3";

const STORAGE_INDEX_KEY = "digital_bus_last_queue_index";
const STORAGE_TIME_KEY = "digital_bus_last_time";
const STORAGE_AMBIENT_KEY = "digital_bus_ambient_enabled";
const STORAGE_MUTED_KEY = "digital_bus_is_muted";
const STORAGE_SHUFFLE_KEY = "digital_bus_shuffle_enabled";

/** Fisher-Yates shuffle helper function */
function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function useAudioPlayer(playlist: Track[]) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [trackIndex, setTrackIndex] = useState(0);

  const autoPlayNextRef = useRef(false);
  const failedAttemptsRef = useRef(0);
  const isDraggingRef = useRef(false);
  const historyRef = useRef<number[]>([]);
  const isShuffleRef = useRef(false);

  // Shuffled Queue State
  const shuffledQueueRef = useRef<number[]>([]);
  const queuePointerRef = useRef(0);

  const setDraggingState = useCallback((dragging: boolean) => {
    isDraggingRef.current = dragging;
  }, []);

  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);
  const [isAmbientEnabled, setIsAmbientEnabled] = useState(false);

  // ID3 Metadata
  const [id3Meta, setId3Meta] = useState<ID3Metadata | null>(null);

  /** Generate a shuffled queue starting with the current track */
  const initShuffledQueue = useCallback((startIdx: number, total: number) => {
    if (total <= 0) return;
    const indices = Array.from({ length: total }, (_, i) => i);
    const rest = indices.filter((i) => i !== startIdx);
    const shuffledRest = shuffleArray(rest);
    shuffledQueueRef.current = [startIdx, ...shuffledRest];
    queuePointerRef.current = 0;
  }, []);

  // Restore saved session index & preferences from localStorage / URL search params
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedMuted = localStorage.getItem(STORAGE_MUTED_KEY);
      if (savedMuted === "true") {
        setIsMuted(true);
      }
      const savedAmbient = localStorage.getItem(STORAGE_AMBIENT_KEY);
      if (savedAmbient === "true") {
        setIsAmbientEnabled(true);
      }
      const savedShuffle = localStorage.getItem(STORAGE_SHUFFLE_KEY);
      if (savedShuffle === "true") {
        setIsShuffle(true);
        isShuffleRef.current = true;
      }

      let initialIdx = 0;

      // Check URL query parameters for ?song=ID; keep ?track=ID for older shared links
      const params = new URLSearchParams(window.location.search);
      const trackParam = params.get("song") ?? params.get("track");
      if (trackParam) {
        const foundIdx = playlist.findIndex((t) => String(t.id) === trackParam);
        if (foundIdx !== -1) {
          initialIdx = foundIdx;
        }
      } else {
        const savedIdx = localStorage.getItem(STORAGE_INDEX_KEY);
        if (savedIdx !== null) {
          const parsed = parseInt(savedIdx, 10);
          if (!isNaN(parsed) && parsed >= 0 && parsed < playlist.length) {
            initialIdx = parsed;
          }
        }
      }

      setTrackIndex(initialIdx);
      initShuffledQueue(initialIdx, playlist.length);
    } catch {
      // Ignore
    }
  }, [playlist, initShuffledQueue]);

  const currentTrackIndex = trackIndex < playlist.length ? trackIndex : 0;
  const currentTrack = playlist[currentTrackIndex] ?? playlist[0];

  const nextRef = useRef<() => void>(() => {});

  const playTrack = useCallback(
    (index: number, autoPlay = true) => {
      if (index < 0 || index >= playlist.length) return;
      autoPlayNextRef.current = autoPlay;
      historyRef.current.push(currentTrackIndex);
      setTrackIndex(index);

      if (isShuffleRef.current) {
        initShuffledQueue(index, playlist.length);
      }

      try {
        localStorage.setItem(STORAGE_INDEX_KEY, String(index));
      } catch {
        // Ignore
      }
    },
    [playlist.length, currentTrackIndex, initShuffledQueue],
  );

  const next = useCallback(
    (autoPlay = true) => {
      autoPlayNextRef.current = autoPlay;
      setTrackIndex((prevIdx) => {
        let nextIdx: number;

        if (isShuffleRef.current) {
          historyRef.current.push(prevIdx);

          if (shuffledQueueRef.current.length !== playlist.length) {
            initShuffledQueue(prevIdx, playlist.length);
          }

          queuePointerRef.current += 1;
          if (queuePointerRef.current >= shuffledQueueRef.current.length) {
            // Cycle exhausted — create a fresh shuffle cycle
            initShuffledQueue(prevIdx, playlist.length);
            queuePointerRef.current = Math.min(1, shuffledQueueRef.current.length - 1);
          }

          nextIdx = shuffledQueueRef.current[queuePointerRef.current] ?? 0;
        } else {
          nextIdx = (prevIdx + 1) % playlist.length;
        }

        try {
          localStorage.setItem(STORAGE_INDEX_KEY, String(nextIdx));
        } catch {
          // Ignore
        }
        return nextIdx;
      });
    },
    [playlist.length, initShuffledQueue],
  );

  useEffect(() => {
    nextRef.current = () => next(true);
  }, [next]);

  const previous = useCallback(() => {
    const audio = audioRef.current;
    const wasPlaying = isPlaying || (audio ? !audio.paused : true);
    autoPlayNextRef.current = wasPlaying;

    setTrackIndex((prevIdx) => {
      let targetIdx: number;

      if (isShuffleRef.current && historyRef.current.length > 0) {
        targetIdx = historyRef.current.pop()!;
      } else {
        targetIdx = prevIdx > 0 ? prevIdx - 1 : playlist.length - 1;
      }

      try {
        localStorage.setItem(STORAGE_INDEX_KEY, String(targetIdx));
      } catch {
        // Ignore
      }
      return targetIdx;
    });
  }, [playlist.length, isPlaying]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => {
      const nextState = !prev;
      isShuffleRef.current = nextState;

      if (nextState) {
        initShuffledQueue(currentTrackIndex, playlist.length);
      }

      try {
        localStorage.setItem(STORAGE_SHUFFLE_KEY, String(nextState));
      } catch {
        // Ignore
      }
      return nextState;
    });
  }, [currentTrackIndex, playlist.length, initShuffledQueue]);

  // Expose global control methods on window for keyboard shortcuts
  useEffect(() => {
    if (typeof window === "undefined") return;

    const w = window as unknown as Window & {
      digitalBusToggleMute?: () => void;
      digitalBusNextTrack?: () => void;
      digitalBusPreviousTrack?: () => void;
      digitalBusToggleShuffle?: () => void;
      digitalBusOpenPlaylist?: () => void;
      digitalBusOpenTicket?: () => void;
    };

    w.digitalBusToggleMute = () => {
      setIsMuted((prev) => {
        const nextState = !prev;
        if (audioRef.current) {
          audioRef.current.muted = nextState;
        }
        try {
          localStorage.setItem(STORAGE_MUTED_KEY, String(nextState));
        } catch {
          // Ignore
        }
        return nextState;
      });
    };

    w.digitalBusNextTrack = () => next(true);
    w.digitalBusPreviousTrack = () => previous();
    w.digitalBusToggleShuffle = () => toggleShuffle();

    return () => {
      delete w.digitalBusToggleMute;
      delete w.digitalBusNextTrack;
      delete w.digitalBusPreviousTrack;
      delete w.digitalBusToggleShuffle;
    };
  }, [next, previous, toggleShuffle]);

  // Initialize HTML5 Audio element & event listeners
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;
    if (typeof window !== "undefined") {
      (window as unknown as { digitalBusAudio?: HTMLAudioElement }).digitalBusAudio = audio;
    }

    try {
      const savedMuted = localStorage.getItem(STORAGE_MUTED_KEY);
      if (savedMuted === "true") {
        audio.muted = true;
      }
    } catch {
      // Ignore
    }

    const onPlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
      failedAttemptsRef.current = 0;
    };

    const onPause = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };

    const onWaiting = () => {
      setIsLoading(true);
    };

    const onCanPlay = () => {
      setIsLoading(false);
      if (autoPlayNextRef.current) {
        void audio.play().catch(() => {
          setIsPlaying(false);
          setIsLoading(false);
        });
      }
    };

    const onTimeUpdate = () => {
      if (isDraggingRef.current) return;
      setProgress(audio.currentTime);
      if (audio.duration && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
      if (Math.floor(audio.currentTime) % 5 === 0) {
        try {
          localStorage.setItem(STORAGE_TIME_KEY, String(audio.currentTime));
        } catch {
          // Ignore
        }
      }
    };

    const onLoadedMetadata = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      setIsLoading(false);
      setError(false);
    };

    const onEnded = () => {
      autoPlayNextRef.current = true;
      setIsPlaying(false);
      nextRef.current();
    };

    const onError = () => {
      setIsPlaying(false);
      setIsLoading(false);
      setError(true);
      failedAttemptsRef.current += 1;

      if (failedAttemptsRef.current < 3) {
        setTimeout(() => {
          autoPlayNextRef.current = true;
          nextRef.current();
        }, 1200);
      }
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.src = "";
      if (typeof window !== "undefined") {
        delete (window as unknown as { digitalBusAudio?: HTMLAudioElement }).digitalBusAudio;
      }
    };
  }, []);

  // Load current track into single audio element & extract ID3 tags
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    let isSubscribed = true;
    const shouldAutoPlay = autoPlayNextRef.current;

    setProgress(0);
    setDuration(0);
    setError(false);
    setIsLoading(true);
    setId3Meta(null);

    const encodedUrl = encodeURI(currentTrack.audio);

    audio.pause();
    audio.src = encodedUrl;
    audio.load();

    if (shouldAutoPlay) {
      void audio
        .play()
        .then(() => {
          if (isSubscribed) {
            setIsPlaying(true);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (isSubscribed) {
            setIsPlaying(false);
            setIsLoading(false);
          }
        });
    }

    void extractID3Metadata(encodedUrl).then((meta) => {
      if (isSubscribed) {
        setId3Meta(meta);
      }
    });

    return () => {
      isSubscribed = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrackIndex, currentTrack?.audio]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nextState = !prev;
      if (audioRef.current) {
        audioRef.current.muted = nextState;
      }
      try {
        localStorage.setItem(STORAGE_MUTED_KEY, String(nextState));
      } catch {
        // Ignore
      }
      return nextState;
    });
  }, []);

  const toggleAmbient = useCallback(() => {
    setIsAmbientEnabled((prev) => {
      const nextState = !prev;
      try {
        localStorage.setItem(STORAGE_AMBIENT_KEY, String(nextState));
      } catch {
        // Ignore
      }

      if (nextState) {
        startAmbientBus(0.06);
      } else {
        stopAmbientBus();
      }
      return nextState;
    });
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      setIsLoading(true);
      autoPlayNextRef.current = false;
      void audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
          if (isAmbientEnabled) {
            setAmbientVolume(0.06);
          }
        })
        .catch(() => {
          setIsPlaying(false);
          setIsLoading(false);
        });
    } else {
      audio.pause();
      setIsPlaying(false);
      setIsLoading(false);
    }
  }, [isAmbientEnabled]);

  const retry = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    setError(false);
    setIsLoading(true);
    failedAttemptsRef.current = 0;
    autoPlayNextRef.current = true;
    audio.src = encodeURI(currentTrack.audio);
    audio.load();
    void audio
      .play()
      .then(() => {
        setIsPlaying(true);
        setIsLoading(false);
      })
      .catch(() => {
        setIsPlaying(false);
        setIsLoading(false);
        setError(true);
      });
  }, [currentTrack]);

  const seek = useCallback((ratio: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const t = Math.min(Math.max(ratio, 0), 1) * audio.duration;
    audio.currentTime = t;
    setProgress(t);
  }, []);

  const displayTitle = id3Meta?.title || currentTrack?.title || "JNU Bus Track";
  const displayArtist = id3Meta?.artist || currentTrack?.artist || "Driver's Radio";
  const displayCover = id3Meta?.coverUrl || currentTrack?.cover || "/covers/song-01.jpg";

  let nextTrackIndex: number;
  if (isShuffleRef.current && shuffledQueueRef.current.length > 0) {
    const nextPtr = (queuePointerRef.current + 1) % shuffledQueueRef.current.length;
    nextTrackIndex = shuffledQueueRef.current[nextPtr] ?? (currentTrackIndex + 1) % playlist.length;
  } else {
    nextTrackIndex = (currentTrackIndex + 1) % playlist.length;
  }

  const nextTrackPreviewTitle = playlist[nextTrackIndex]?.title || "Next Song";

  return {
    track: currentTrack,
    currentTrackIndex,
    nextTrackTitle: nextTrackPreviewTitle,
    displayTitle,
    displayArtist,
    displayCover,
    totalTracks: playlist.length,
    isPlaying,
    isLoading,
    isMuted,
    isShuffle,
    progress,
    duration,
    error,
    isAmbientEnabled,
    toggleMute,
    toggleAmbient,
    toggleShuffle,
    toggle,
    next: () => next(true),
    previous,
    playTrack,
    retry,
    seek,
    setDraggingState,
  };
}

export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
