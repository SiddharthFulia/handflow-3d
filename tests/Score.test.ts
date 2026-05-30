import { describe, it, expect } from 'vitest';
import { Score } from '../src/game/Score';

describe('Score', () => {
  it('starts at zero', () => {
    const s = new Score();
    const snap = s.snapshot();
    expect(snap.score).toBe(0);
    expect(snap.combo).toBe(0);
    expect(snap.multiplier).toBe(1);
    expect(snap.coins).toBe(0);
  });

  it('pickupCoin awards 10 base points and increments combo', () => {
    const s = new Score(2000);
    s.pickupCoin(0);
    s.pickupCoin(500);
    const snap = s.snapshot();
    expect(snap.score).toBe(20);
    expect(snap.combo).toBe(2);
    expect(snap.multiplier).toBe(1);
  });

  it('multiplier rises at combo 5 to 2x, then 3x at 10', () => {
    const s = new Score(10_000);
    for (let i = 0; i < 4; i++) s.pickupCoin(i * 100);
    expect(s.snapshot().multiplier).toBe(1);
    s.pickupCoin(500);
    expect(s.snapshot().multiplier).toBe(2);
    for (let i = 0; i < 5; i++) s.pickupCoin(600 + i * 100);
    expect(s.snapshot().multiplier).toBe(3);
  });

  it('multiplier caps at 5x', () => {
    const s = new Score(60_000);
    for (let i = 0; i < 100; i++) s.pickupCoin(i * 10);
    expect(s.snapshot().multiplier).toBe(5);
  });

  it('grace ms exceeded → combo resets on next pickup', () => {
    const s = new Score(500);
    s.pickupCoin(0);
    s.pickupCoin(100);
    expect(s.snapshot().combo).toBe(2);
    s.pickupCoin(1000); // grace exceeded → combo reset then +1
    expect(s.snapshot().combo).toBe(1);
  });

  it('tick resets combo when grace elapses without pickup', () => {
    const s = new Score(500);
    s.pickupCoin(0);
    expect(s.snapshot().combo).toBe(1);
    s.tick(2000);
    expect(s.snapshot().combo).toBe(0);
  });

  it('breakCombo zeros combo without touching score', () => {
    const s = new Score();
    s.pickupCoin(0);
    s.pickupCoin(50);
    const before = s.snapshot().score;
    s.breakCombo();
    expect(s.snapshot().combo).toBe(0);
    expect(s.snapshot().score).toBe(before);
  });

  it('awardDistance accrues fractional points', () => {
    const s = new Score();
    s.awardDistance(1, 10);
    s.awardDistance(0.5, 20);
    expect(s.snapshot().score).toBe(20);
  });

  it('reset clears every counter', () => {
    const s = new Score();
    s.pickupCoin(0);
    s.awardDistance(1, 50);
    s.reset();
    expect(s.snapshot()).toEqual({ score: 0, combo: 0, multiplier: 1, coins: 0 });
  });
});
