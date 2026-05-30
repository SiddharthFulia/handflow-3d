import { describe, it, expect } from 'vitest';
import { CollisionGrid } from '../src/game/CollisionGrid';

describe('CollisionGrid', () => {
  it('insert + query finds an obstacle on the same lane', () => {
    const g = new CollisionGrid(4);
    g.insert({ id: 1, lane: 1, zStart: -10, zEnd: -8, type: 'barrier' });
    const hits = g.query(1, -10, -8);
    expect(hits.length).toBe(1);
    expect(hits[0].id).toBe(1);
  });

  it('does not match other lanes', () => {
    const g = new CollisionGrid();
    g.insert({ id: 1, lane: 0, zStart: -10, zEnd: -8, type: 'barrier' });
    expect(g.query(1, -10, -8)).toEqual([]);
    expect(g.query(2, -10, -8)).toEqual([]);
  });

  it('handles an entry spanning multiple cells', () => {
    const g = new CollisionGrid(4);
    g.insert({ id: 7, lane: 2, zStart: -20, zEnd: -5, type: 'train' });
    expect(g.query(2, -18, -17).length).toBe(1);
    expect(g.query(2, -7, -6).length).toBe(1);
    expect(g.query(2, -11, -10).length).toBe(1);
  });

  it('remove cleans up multi-cell entries', () => {
    const g = new CollisionGrid(4);
    g.insert({ id: 7, lane: 2, zStart: -20, zEnd: -5, type: 'train' });
    g.remove(7);
    expect(g.query(2, -18, -17)).toEqual([]);
    expect(g.size()).toBe(0);
  });

  it('clearWindow removes only fully-contained entries', () => {
    const g = new CollisionGrid();
    g.insert({ id: 1, lane: 0, zStart: -10, zEnd: -8, type: 'barrier' });
    g.insert({ id: 2, lane: 1, zStart: -7, zEnd: -6, type: 'coin' });
    g.insert({ id: 3, lane: 2, zStart: -3, zEnd: -2, type: 'barrier' });
    const removed = g.clearWindow(-12, -5);
    expect(removed.sort()).toEqual([1, 2]);
    expect(g.size()).toBe(1);
  });

  it('overlapping query returns dedup ids only once', () => {
    const g = new CollisionGrid(2);
    g.insert({ id: 99, lane: 1, zStart: -10, zEnd: -1, type: 'train' });
    const hits = g.query(1, -8, -2);
    expect(hits.length).toBe(1);
    expect(hits[0].id).toBe(99);
  });

  it('clear removes every entry', () => {
    const g = new CollisionGrid();
    g.insert({ id: 1, lane: 0, zStart: 0, zEnd: 1, type: 'coin' });
    g.insert({ id: 2, lane: 1, zStart: 0, zEnd: 1, type: 'coin' });
    g.clear();
    expect(g.size()).toBe(0);
  });
});
