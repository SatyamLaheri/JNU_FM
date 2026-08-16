// Web Audio API Synthesizer for Authentic Indian Bus Horn and Travel Ambience

let audioCtx: AudioContext | null = null;
let ambientSource: AudioBufferSourceNode | null = null;
let ambientGain: GainNode | null = null;
let isAmbientPlaying = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Synthesizes an authentic Indian pneumatic bus trumpet horn ("Paa-Paaan!")
 * modeling classic Tata/Leyland dual-tone brass pressure horns.
 */
export function playBusHorn() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Helper to trigger a single pneumatic brass honk pulse
    const createHonkPulse = (startTime: number, duration: number, volume: number) => {
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02); // Sharp attack
      gainNode.gain.setValueAtTime(volume, startTime + duration - 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      // Bandpass filter for authentic metallic trumpet resonance
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(680, startTime);
      filter.Q.setValueAtTime(2.2, startTime);

      // Low Freq oscillator (Tata bus 310 Hz tone)
      const oscLow = ctx.createOscillator();
      oscLow.type = "sawtooth";
      oscLow.frequency.setValueAtTime(312, startTime);
      oscLow.frequency.exponentialRampToValueAtTime(308, startTime + duration);

      // High Freq oscillator (Tata bus 392 Hz tone)
      const oscHigh = ctx.createOscillator();
      oscHigh.type = "sawtooth";
      oscHigh.frequency.setValueAtTime(392, startTime);
      oscHigh.frequency.exponentialRampToValueAtTime(386, startTime + duration);

      // Sub-harmonic sine tone for depth
      const oscSub = ctx.createOscillator();
      oscSub.type = "sine";
      oscSub.frequency.setValueAtTime(156, startTime);

      oscLow.connect(filter);
      oscHigh.connect(filter);
      oscSub.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscLow.start(startTime);
      oscHigh.start(startTime);
      oscSub.start(startTime);

      oscLow.stop(startTime + duration);
      oscHigh.stop(startTime + duration);
      oscSub.stop(startTime + duration);
    };

    // Authentic Indian dual honk rhythm: "PAA-PAAAN!"
    createHonkPulse(now, 0.18, 0.22); // First short burst
    createHonkPulse(now + 0.24, 0.38, 0.26); // Second main loud blast
  } catch (err) {
    console.warn("AudioContext horn synthesis blocked:", err);
  }
}

/**
 * Generates continuous low-pass brown noise to simulate gentle bus engine/road ambience.
 */
export function startAmbientBus(volume = 0.05) {
  if (isAmbientPlaying) return;
  try {
    const ctx = getAudioContext();
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }

    ambientSource = ctx.createBufferSource();
    ambientSource.buffer = buffer;
    ambientSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(140, ctx.currentTime);

    ambientGain = ctx.createGain();
    ambientGain.gain.setValueAtTime(volume, ctx.currentTime);

    ambientSource.connect(filter);
    filter.connect(ambientGain);
    ambientGain.connect(ctx.destination);

    ambientSource.start(0);
    isAmbientPlaying = true;
  } catch (err) {
    console.warn("Ambient bus synthesis error:", err);
  }
}

export function stopAmbientBus() {
  if (ambientSource) {
    try {
      ambientSource.stop();
      ambientSource.disconnect();
    } catch {
      // Ignore
    }
    ambientSource = null;
  }
  isAmbientPlaying = false;
}

export function setAmbientVolume(volume: number) {
  if (ambientGain && audioCtx) {
    ambientGain.gain.setValueAtTime(Math.max(0, Math.min(volume, 0.25)), audioCtx.currentTime);
  }
}
