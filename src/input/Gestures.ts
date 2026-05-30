export type GestureIntent =
  | { kind: 'lane'; lane: 0 | 1 | 2; tMs: number }
  | { kind: 'jump'; tMs: number }
  | { kind: 'roll'; tMs: number }
  | { kind: 'pause'; tMs: number };

export interface Landmark { x: number; y: number; z?: number }
export type HandLandmarks = Landmark[];

const PALM_CENTER_INDEX = 9;
const WRIST_INDEX = 0;

interface State {
  currentLane: 0 | 1 | 2;
  lastEmitAt: number;
  lastJumpAt: number;
  lastRollAt: number;
  closedSince: number | null;
}

export interface GesturesConfig {
  enterLeft: number;
  exitLeft: number;
  enterRight: number;
  exitRight: number;
  jumpY: number;
  rollY: number;
  dwellMs: number;
  jumpCooldownMs: number;
  rollCooldownMs: number;
  fistDwellMs: number;
}

export const DEFAULT_GESTURE_CFG: GesturesConfig = {
  enterLeft: 0.30,
  exitLeft: 0.40,
  enterRight: 0.70,
  exitRight: 0.60,
  jumpY: 0.30,
  rollY: 0.75,
  dwellMs: 80,
  jumpCooldownMs: 350,
  rollCooldownMs: 350,
  fistDwellMs: 600
};

type Listener = (intent: GestureIntent) => void;

export class Gestures {
  private cfg: GesturesConfig;
  private st: State = {
    currentLane: 1,
    lastEmitAt: -Infinity,
    lastJumpAt: -Infinity,
    lastRollAt: -Infinity,
    closedSince: null
  };
  private listeners: Set<Listener> = new Set();

  constructor(cfg: Partial<GesturesConfig> = {}) {
    this.cfg = { ...DEFAULT_GESTURE_CFG, ...cfg };
  }

  reset() {
    this.st = {
      currentLane: 1,
      lastEmitAt: -Infinity,
      lastJumpAt: -Infinity,
      lastRollAt: -Infinity,
      closedSince: null
    };
  }

  onIntent(l: Listener): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  publish(intent: GestureIntent) {
    this.listeners.forEach((l) => l(intent));
  }

  /** Process one frame of mirrored landmarks. Returns at most one intent. */
  process(landmarks: HandLandmarks | null, tMs: number): GestureIntent | null {
    if (!landmarks || landmarks.length < 21) {
      this.st.closedSince = null;
      return null;
    }
    const palm = landmarks[PALM_CENTER_INDEX];
    if (!palm) return null;

    // jump/roll take precedence — a raised+drifted hand should still jump
    if (palm.y < this.cfg.jumpY && tMs - this.st.lastJumpAt > this.cfg.jumpCooldownMs) {
      this.st.lastJumpAt = tMs;
      this.st.lastEmitAt = tMs;
      return { kind: 'jump', tMs };
    }
    if (palm.y > this.cfg.rollY && tMs - this.st.lastRollAt > this.cfg.rollCooldownMs) {
      this.st.lastRollAt = tMs;
      this.st.lastEmitAt = tMs;
      return { kind: 'roll', tMs };
    }

    const fistClosed = isFistClosed(landmarks);
    if (fistClosed) {
      if (this.st.closedSince === null) this.st.closedSince = tMs;
      else if (tMs - this.st.closedSince > this.cfg.fistDwellMs) {
        this.st.closedSince = null;
        this.st.lastEmitAt = tMs;
        return { kind: 'pause', tMs };
      }
    } else {
      this.st.closedSince = null;
    }

    if (tMs - this.st.lastEmitAt < this.cfg.dwellMs) return null;
    const x = palm.x;
    const cur = this.st.currentLane;

    if (cur === 1) {
      if (x < this.cfg.enterLeft) {
        this.st.currentLane = 0;
        this.st.lastEmitAt = tMs;
        return { kind: 'lane', lane: 0, tMs };
      }
      if (x > this.cfg.enterRight) {
        this.st.currentLane = 2;
        this.st.lastEmitAt = tMs;
        return { kind: 'lane', lane: 2, tMs };
      }
    } else if (cur === 0) {
      if (x > this.cfg.exitLeft) {
        this.st.currentLane = 1;
        this.st.lastEmitAt = tMs;
        return { kind: 'lane', lane: 1, tMs };
      }
    } else {
      if (x < this.cfg.exitRight) {
        this.st.currentLane = 1;
        this.st.lastEmitAt = tMs;
        return { kind: 'lane', lane: 1, tMs };
      }
    }
    return null;
  }

  _internalLane(): 0 | 1 | 2 {
    return this.st.currentLane;
  }
}

function isFistClosed(lm: HandLandmarks): boolean {
  // image y grows downward, so tip below pip == larger y
  const fingerPairs: [number, number][] = [
    [8, 6],
    [12, 10],
    [16, 14],
    [20, 18]
  ];
  let closed = 0;
  for (const [tip, pip] of fingerPairs) {
    if (lm[tip] && lm[pip] && lm[tip].y > lm[pip].y) closed++;
  }
  return closed >= 3;
}
