import { describe, it, expect } from 'vitest';
import { Gestures, HandLandmarks } from '../src/input/Gestures';

/** Build a 21-landmark hand fixture; only palm + finger tips/pips matter here. */
function frame(palmX: number, palmY: number, opts: { fist?: boolean } = {}): HandLandmarks {
  const lm: HandLandmarks = [];
  for (let i = 0; i < 21; i++) lm.push({ x: 0.5, y: 0.5, z: 0 });
  lm[9] = { x: palmX, y: palmY, z: 0 };
  if (opts.fist) {
    lm[6] = { x: 0.5, y: 0.4, z: 0 };
    lm[8] = { x: 0.5, y: 0.6, z: 0 };
    lm[10] = { x: 0.5, y: 0.4, z: 0 };
    lm[12] = { x: 0.5, y: 0.6, z: 0 };
    lm[14] = { x: 0.5, y: 0.4, z: 0 };
    lm[16] = { x: 0.5, y: 0.6, z: 0 };
    lm[18] = { x: 0.5, y: 0.4, z: 0 };
    lm[20] = { x: 0.5, y: 0.6, z: 0 };
  } else {
    lm[6] = { x: 0.5, y: 0.6, z: 0 };
    lm[8] = { x: 0.5, y: 0.3, z: 0 };
    lm[10] = { x: 0.5, y: 0.6, z: 0 };
    lm[12] = { x: 0.5, y: 0.3, z: 0 };
    lm[14] = { x: 0.5, y: 0.6, z: 0 };
    lm[16] = { x: 0.5, y: 0.3, z: 0 };
    lm[18] = { x: 0.5, y: 0.6, z: 0 };
    lm[20] = { x: 0.5, y: 0.3, z: 0 };
  }
  return lm;
}

describe('Gestures', () => {
  it('returns null when no landmarks supplied', () => {
    const g = new Gestures();
    expect(g.process(null, 0)).toBeNull();
    expect(g.process([], 0)).toBeNull();
  });

  it('emits a lane:0 intent when palm moves left past enter threshold', () => {
    const g = new Gestures();
    expect(g.process(frame(0.5, 0.5), 0)).toBeNull();
    const r = g.process(frame(0.25, 0.5), 100);
    expect(r).toEqual({ kind: 'lane', lane: 0, tMs: 100 });
    expect(g._internalLane()).toBe(0);
  });

  it('emits a lane:2 intent when palm moves right past enter threshold', () => {
    const g = new Gestures();
    const r = g.process(frame(0.78, 0.5), 50);
    expect(r?.kind).toBe('lane');
    if (r?.kind === 'lane') expect(r.lane).toBe(2);
  });

  it('has hysteresis: returning to 0.42 from left does not flip back to centre', () => {
    const g = new Gestures();
    g.process(frame(0.20, 0.5), 0);
    expect(g._internalLane()).toBe(0);
    const r = g.process(frame(0.38, 0.5), 200);
    expect(r).toBeNull(); // hasn't crossed exitLeft (0.40)
    expect(g._internalLane()).toBe(0);
  });

  it('hysteresis: crossing exit threshold (0.42 > 0.40) returns to centre', () => {
    const g = new Gestures();
    g.process(frame(0.20, 0.5), 0);
    const r = g.process(frame(0.45, 0.5), 200);
    expect(r?.kind).toBe('lane');
    if (r?.kind === 'lane') expect(r.lane).toBe(1);
  });

  it('emits a jump intent when palm goes high', () => {
    const g = new Gestures();
    const r = g.process(frame(0.5, 0.15), 0);
    expect(r?.kind).toBe('jump');
  });

  it('jump cooldown blocks back-to-back jumps', () => {
    const g = new Gestures();
    expect(g.process(frame(0.5, 0.15), 0)?.kind).toBe('jump');
    expect(g.process(frame(0.5, 0.15), 100)).toBeNull();
    expect(g.process(frame(0.5, 0.15), 400)?.kind).toBe('jump');
  });

  it('emits a roll intent when palm goes low', () => {
    const g = new Gestures();
    const r = g.process(frame(0.5, 0.85), 0);
    expect(r?.kind).toBe('roll');
  });

  it('closed fist dwell emits a pause intent', () => {
    const g = new Gestures();
    g.process(frame(0.5, 0.5, { fist: true }), 0);
    expect(g.process(frame(0.5, 0.5, { fist: true }), 300)).toBeNull();
    const r = g.process(frame(0.5, 0.5, { fist: true }), 700);
    expect(r?.kind).toBe('pause');
  });

  it('opening hand resets fist timer', () => {
    const g = new Gestures();
    g.process(frame(0.5, 0.5, { fist: true }), 0);
    g.process(frame(0.5, 0.5), 200);
    const r = g.process(frame(0.5, 0.5, { fist: true }), 400);
    expect(r).toBeNull(); // fist timer restarted at 400ms, needs ≥ 600 dwell
  });

  it('full sweep: centre → left → centre → right is a 3-intent stream', () => {
    const g = new Gestures();
    const out: string[] = [];
    let r = g.process(frame(0.5, 0.5), 0);
    if (r) out.push(r.kind === 'lane' ? `lane${r.lane}` : r.kind);
    r = g.process(frame(0.25, 0.5), 100);
    if (r) out.push(r.kind === 'lane' ? `lane${r.lane}` : r.kind);
    r = g.process(frame(0.5, 0.5), 300);
    if (r) out.push(r.kind === 'lane' ? `lane${r.lane}` : r.kind);
    r = g.process(frame(0.78, 0.5), 500);
    if (r) out.push(r.kind === 'lane' ? `lane${r.lane}` : r.kind);
    expect(out).toEqual(['lane0', 'lane1', 'lane2']);
  });
});
