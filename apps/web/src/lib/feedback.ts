// ---------------------------------------------------------------------------
// Haptic & Sound feedback utilities
// Uses Web APIs only — no external libraries
// ---------------------------------------------------------------------------

let hapticEnabled = true;
let soundEnabled = true;

export function setHapticEnabled(v: boolean) {
  hapticEnabled = v;
}

export function setSoundEnabled(v: boolean) {
  soundEnabled = v;
}

// ---------------------------------------------------------------------------
// Haptic feedback via navigator.vibrate()
// ---------------------------------------------------------------------------

const HAPTIC_PATTERNS = {
  light: [10],
  medium: [20],
  heavy: [30],
  success: [10, 50, 20],
  error: [30, 50, 30],
} as const;

export type HapticPattern = keyof typeof HAPTIC_PATTERNS;

export function haptic(pattern: HapticPattern) {
  if (!hapticEnabled) return;
  try {
    navigator?.vibrate?.([...HAPTIC_PATTERNS[pattern]]);
  } catch {
    // Silently fail on unsupported browsers
  }
}

// ---------------------------------------------------------------------------
// Sound feedback via AudioContext oscillator
// ---------------------------------------------------------------------------

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (!soundEnabled) return null;
  try {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
    // Resume if suspended (browser autoplay policy)
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.08,
) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);

  gain.gain.setValueAtTime(volume, ctx.currentTime);
  // Quick fade out to avoid click
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export type SoundType =
  | "flip"
  | "swipeRight"
  | "swipeLeft"
  | "swipeUp"
  | "rate"
  | "complete";

export function playSound(type: SoundType) {
  if (!soundEnabled) return;

  switch (type) {
    case "flip":
      // Quick descending tone
      playTone(600, 0.12, "sine", 0.06);
      break;

    case "swipeRight":
      // Ascending major — positive
      playTone(440, 0.1, "sine", 0.06);
      setTimeout(() => playTone(554, 0.1, "sine", 0.06), 60);
      break;

    case "swipeLeft":
      // Descending minor — negative
      playTone(440, 0.1, "sine", 0.06);
      setTimeout(() => playTone(370, 0.1, "sine", 0.06), 60);
      break;

    case "swipeUp":
      // Triumphant ascending — mastered!
      playTone(523, 0.1, "sine", 0.06); // C
      setTimeout(() => playTone(659, 0.1, "sine", 0.06), 70); // E
      setTimeout(() => playTone(784, 0.15, "sine", 0.07), 140); // G
      break;

    case "rate":
      // Short pop
      playTone(800, 0.05, "sine", 0.04);
      break;

    case "complete":
      // Ascending arpeggio
      playTone(523, 0.15, "sine", 0.06); // C
      setTimeout(() => playTone(659, 0.15, "sine", 0.06), 100); // E
      setTimeout(() => playTone(784, 0.2, "sine", 0.06), 200); // G
      setTimeout(() => playTone(1047, 0.25, "sine", 0.07), 320); // C (octave)
      break;
  }
}
