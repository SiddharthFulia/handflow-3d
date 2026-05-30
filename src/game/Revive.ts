// One free revive per run.

export interface ReviveResult {
  granted: boolean;
  clearedAheadUnits: number;
}

export class Revive {
  private _available = true;
  private clearWindow: number;

  constructor(clearWindow = 30) {
    this.clearWindow = clearWindow;
  }

  reset() {
    this._available = true;
  }

  available(): boolean {
    return this._available;
  }

  /** Granted=false if already used this run. */
  consume(): ReviveResult {
    if (!this._available) {
      return { granted: false, clearedAheadUnits: 0 };
    }
    this._available = false;
    return { granted: true, clearedAheadUnits: this.clearWindow };
  }
}
