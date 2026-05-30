// speed(t) = start + (top - start) * tanh(t / horizon) — smooth, no step.

export type DifficultyKey = 'easy' | 'medium' | 'hard' | 'classic';

export interface DifficultyCurve {
  key: DifficultyKey;
  /** world units / second */
  startSpeed: number;
  topSpeed: number;
  /** tanh saturation point; ~76% of range reached at t = horizon */
  horizonSeconds: number;
  /** expected obstacles per 100 world units */
  obstacleDensity: number;
  /** expected coin chains per 100 world units */
  coinDensity: number;
  /** 0..1 probability a slot becomes a ramp instead of a barrier */
  rampChance: number;
  comboGraceMs: number;
}

export const CURVES: Record<DifficultyKey, DifficultyCurve> = {
  easy: {
    key: 'easy',
    startSpeed: 8,
    topSpeed: 16,
    horizonSeconds: 80,
    obstacleDensity: 0.35,
    coinDensity: 0.7,
    rampChance: 0.18,
    comboGraceMs: 1500
  },
  medium: {
    key: 'medium',
    startSpeed: 10,
    topSpeed: 22,
    horizonSeconds: 60,
    obstacleDensity: 0.55,
    coinDensity: 0.6,
    rampChance: 0.22,
    comboGraceMs: 1200
  },
  hard: {
    key: 'hard',
    startSpeed: 12,
    topSpeed: 28,
    horizonSeconds: 45,
    obstacleDensity: 0.75,
    coinDensity: 0.5,
    rampChance: 0.28,
    comboGraceMs: 900
  },
  classic: {
    key: 'classic',
    startSpeed: 9,
    topSpeed: 30,
    horizonSeconds: 120,
    obstacleDensity: 0.6,
    coinDensity: 0.6,
    rampChance: 0.25,
    comboGraceMs: 1100
  }
};

export function speedAt(curve: DifficultyCurve, seconds: number): number {
  if (seconds <= 0) return curve.startSpeed;
  const t = seconds / curve.horizonSeconds;
  const ramp = Math.tanh(t);
  return curve.startSpeed + (curve.topSpeed - curve.startSpeed) * ramp;
}

/** Inverse of speedAt — what elapsed time produces this speed? */
export function timeForSpeed(curve: DifficultyCurve, speed: number): number {
  const clamped = Math.min(Math.max(speed, curve.startSpeed), curve.topSpeed - 0.001);
  const x = (clamped - curve.startSpeed) / (curve.topSpeed - curve.startSpeed);
  return 0.5 * Math.log((1 + x) / (1 - x)) * curve.horizonSeconds;
}

/** `worldUnitsTraveled` is in units of 100. */
export function spawnBudget(curve: DifficultyCurve, worldUnitsTraveled: number): { obstacles: number; coins: number } {
  return {
    obstacles: curve.obstacleDensity * worldUnitsTraveled,
    coins: curve.coinDensity * worldUnitsTraveled
  };
}
