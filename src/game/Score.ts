// Rules:
//   coin = 10 base, multiplier = min(5, floor(combo/5)+1),
//   combo decays after `graceMs` without a pickup, distance ticks 1/unit.

export interface ScoreSnapshot {
  score: number;
  combo: number;
  multiplier: number;
  coins: number;
}

export class Score {
  private _score = 0;
  private _coins = 0;
  private _combo = 0;
  private lastCoinAt = -Infinity;
  private graceMs: number;

  constructor(graceMs = 1200) {
    this.graceMs = graceMs;
  }

  reset() {
    this._score = 0;
    this._coins = 0;
    this._combo = 0;
    this.lastCoinAt = -Infinity;
  }

  setGrace(ms: number) {
    this.graceMs = ms;
  }

  /** `dt` seconds × `speed` world units/s of distance points. */
  awardDistance(dt: number, speed: number): number {
    const pts = dt * speed;
    this._score += pts;
    return pts;
  }

  /** Pick up a coin; returns points awarded after combo multiplier. */
  pickupCoin(nowMs: number): number {
    if (nowMs - this.lastCoinAt > this.graceMs) {
      this._combo = 0;
    }
    this._combo += 1;
    this._coins += 1;
    this.lastCoinAt = nowMs;
    const mult = this.multiplier();
    const pts = 10 * mult;
    this._score += pts;
    return pts;
  }

  breakCombo() {
    this._combo = 0;
  }

  tick(nowMs: number) {
    if (this._combo > 0 && nowMs - this.lastCoinAt > this.graceMs) {
      this._combo = 0;
    }
  }

  multiplier(): number {
    return Math.min(5, Math.floor(this._combo / 5) + 1);
  }

  snapshot(): ScoreSnapshot {
    return {
      score: Math.floor(this._score),
      combo: this._combo,
      multiplier: this.multiplier(),
      coins: this._coins
    };
  }
}
