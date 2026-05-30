import { describe, it, expect } from 'vitest';
import { CURVES, speedAt, timeForSpeed, spawnBudget } from '../src/game/Difficulty';

describe('Difficulty curves', () => {
  it('speedAt(0) returns startSpeed for every curve', () => {
    for (const c of Object.values(CURVES)) {
      expect(speedAt(c, 0)).toBeCloseTo(c.startSpeed, 5);
    }
  });

  it('speed monotonically increases over time and approaches topSpeed', () => {
    const c = CURVES.medium;
    const s0 = speedAt(c, 1);
    const s1 = speedAt(c, 60);
    const s2 = speedAt(c, 600);
    expect(s0).toBeLessThan(s1);
    expect(s1).toBeLessThan(s2);
    expect(s2).toBeLessThanOrEqual(c.topSpeed);
    expect(s2).toBeGreaterThan(c.topSpeed - 0.05);
  });

  it('timeForSpeed is approximate inverse of speedAt', () => {
    const c = CURVES.hard;
    const tSample = 22;
    const v = speedAt(c, tSample);
    const tBack = timeForSpeed(c, v);
    expect(tBack).toBeCloseTo(tSample, 1);
  });

  it('easy is slower than hard at every t > 0', () => {
    for (const t of [1, 5, 30, 120]) {
      expect(speedAt(CURVES.easy, t)).toBeLessThan(speedAt(CURVES.hard, t));
    }
  });

  it('classic has the highest topSpeed', () => {
    const all = Object.values(CURVES).map((c) => c.topSpeed);
    expect(CURVES.classic.topSpeed).toBe(Math.max(...all));
  });

  it('spawnBudget scales linearly with traveled distance', () => {
    const c = CURVES.medium;
    const b1 = spawnBudget(c, 1);
    const b2 = spawnBudget(c, 2);
    expect(b2.obstacles).toBeCloseTo(b1.obstacles * 2, 5);
    expect(b2.coins).toBeCloseTo(b1.coins * 2, 5);
  });

  it('every curve declares a non-zero combo grace window', () => {
    for (const c of Object.values(CURVES)) {
      expect(c.comboGraceMs).toBeGreaterThan(0);
    }
  });
});
