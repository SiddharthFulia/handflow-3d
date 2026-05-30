// Per-key listener sets so React components re-render only on their slice.

import { DifficultyKey } from './Difficulty';

export type GamePhase = 'menu' | 'playing' | 'paused' | 'gameover';

export interface StoreShape {
  phase: GamePhase;
  score: number;
  combo: number;
  coins: number;
  difficulty: DifficultyKey;
  reviveAvailable: boolean;
  laneIndex: 0 | 1 | 2;
  speed: number;
}

type Key = keyof StoreShape;
type Listener<K extends Key> = (value: StoreShape[K]) => void;

const DEFAULTS: StoreShape = {
  phase: 'menu',
  score: 0,
  combo: 0,
  coins: 0,
  difficulty: 'medium',
  reviveAvailable: true,
  laneIndex: 1,
  speed: 0
};

export class Store {
  private state: StoreShape = { ...DEFAULTS };
  private listeners: { [K in Key]?: Set<Listener<K>> } = {};

  get<K extends Key>(key: K): StoreShape[K] {
    return this.state[key];
  }

  set<K extends Key>(key: K, value: StoreShape[K]): void {
    if (this.state[key] === value) return;
    this.state[key] = value;
    const set = this.listeners[key] as Set<Listener<K>> | undefined;
    if (set) set.forEach((l) => l(value));
  }

  subscribe<K extends Key>(key: K, listener: Listener<K>): () => void {
    let set = this.listeners[key] as Set<Listener<K>> | undefined;
    if (!set) {
      set = new Set();
      (this.listeners[key] as Set<Listener<K>>) = set;
    }
    set.add(listener);
    // fire once so consumers don't need a separate read
    listener(this.state[key]);
    return () => set!.delete(listener);
  }

  setPhase(phase: GamePhase) {
    this.set('phase', phase);
  }
  setDifficulty(d: DifficultyKey) {
    this.set('difficulty', d);
  }
  addScore(delta: number) {
    this.set('score', this.state.score + delta);
  }
  setCombo(c: number) {
    this.set('combo', c);
  }
  resetRun() {
    this.state.score = 0;
    this.state.combo = 0;
    this.state.coins = 0;
    this.state.reviveAvailable = true;
    this.state.laneIndex = 1;
    this.state.speed = 0;
    (Object.keys(this.listeners) as Key[]).forEach((k) => {
      const set = this.listeners[k] as Set<Listener<Key>> | undefined;
      if (set) set.forEach((l) => l(this.state[k] as never));
    });
  }
}
