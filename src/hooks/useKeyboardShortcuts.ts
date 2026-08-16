import { useEffect } from "react";

/**
 * Centralized Keyboard Shortcuts for Digital Bus
 *
 * Manages all global keyboard interactions from a single event listener.
 * YouTube-style controls: Space toggles play/pause silently,
 * B triggers bus horn toast, X toggles Xpert Melody promo,
 * Arrow keys seek ±5 seconds.
 *
 * Safety: shortcuts are disabled when the user is typing in inputs,
 * textareas, or contentEditable elements.
 */

type WindowWithDigitalBus = Window & {
  digitalBusAudio?: HTMLAudioElement;
  digitalBusTriggerToast?: (type: string, message?: string) => void;
  digitalBusToggleToast?: (type: string, message?: string) => void;
  digitalBusToggleMute?: () => void;
  digitalBusNextTrack?: () => void;
  digitalBusPreviousTrack?: () => void;
  digitalBusToggleShuffle?: () => void;
  digitalBusOpenPlaylist?: () => void;
  digitalBusOpenTicket?: () => void;
};

function isTypingTarget(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return true;
  if (el.isContentEditable) return true;
  return false;
}

export function useKeyboardShortcuts() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Never intercept shortcuts when user is typing
      if (isTypingTarget(e.target)) return;

      const w = window as unknown as WindowWithDigitalBus;

      switch (e.key) {
        case " ": {
          // Space: Play/Pause — silent, no toast
          if (e.repeat) return;
          e.preventDefault(); // Prevent page scroll

          const audio = w.digitalBusAudio;
          if (!audio) return;

          if (audio.paused) {
            void audio.play().catch(() => {
              // Autoplay policy — silently fail
            });
          } else {
            audio.pause();
          }
          break;
        }

        case "m":
        case "M": {
          // M: YouTube-style Mute/Unmute
          if (e.repeat) return;
          e.preventDefault();
          if (w.digitalBusToggleMute) {
            w.digitalBusToggleMute();
          } else if (w.digitalBusAudio) {
            const audio = w.digitalBusAudio;
            audio.muted = !audio.muted;
            w.digitalBusTriggerToast?.(
              "custom_banner",
              audio.muted ? "Audio Muted 🔇" : "Audio Unmuted 🔊",
            );
          }
          break;
        }

        case "p":
        case "P":
        case "[": {
          // P or [: Previous Track
          if (e.repeat) return;
          e.preventDefault();
          w.digitalBusPreviousTrack?.();
          break;
        }

        case "n":
        case "N":
        case "]": {
          // N or ]: Next Track
          if (e.repeat) return;
          e.preventDefault();
          w.digitalBusNextTrack?.();
          break;
        }

        case "q":
        case "Q": {
          if (e.repeat) return;
          e.preventDefault();
          w.digitalBusOpenPlaylist?.();
          break;
        }

        case "t":
        case "T": {
          if (e.repeat) return;
          e.preventDefault();
          w.digitalBusOpenTicket?.();
          break;
        }

        case "s":
        case "S": {
          if (e.repeat) return;
          e.preventDefault();
          w.digitalBusToggleShuffle?.();
          break;
        }

        case "b":
        case "B": {
          if (e.repeat) return;
          w.digitalBusTriggerToast?.("b_key", "Shhhhh... enjoy the music 🎧");
          break;
        }

        case "x":
        case "X": {
          if (e.repeat) return;
          w.digitalBusToggleToast?.("xpert_promo");
          break;
        }

        case "ArrowLeft": {
          // Seek backward ~5 seconds
          e.preventDefault(); // Prevent horizontal scroll
          const audioL = w.digitalBusAudio;
          if (!audioL || !audioL.duration) return;
          audioL.currentTime = Math.max(0, audioL.currentTime - 5);
          break;
        }

        case "ArrowRight": {
          // Seek forward ~5 seconds
          e.preventDefault(); // Prevent horizontal scroll
          const audioR = w.digitalBusAudio;
          if (!audioR || !audioR.duration) return;
          audioR.currentTime = Math.min(audioR.duration, audioR.currentTime + 5);
          break;
        }

        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
}
