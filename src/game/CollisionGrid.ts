// Lane × z-cell grid: O(k) per query vs O(n) for naive box3 sweep.
// k is obstacles in player's current cell — usually ≤ 2.

export type LaneIndex = 0 | 1 | 2;

export interface GridEntry {
  id: number;
  lane: LaneIndex;
  zStart: number;
  zEnd: number;
  type: 'barrier' | 'train' | 'ramp' | 'coin';
}

export class CollisionGrid {
  private cells: Map<string, GridEntry[]> = new Map();
  private cellDepth: number;
  private byId: Map<number, GridEntry> = new Map();

  constructor(cellDepth = 4) {
    this.cellDepth = cellDepth;
  }

  private keyFor(lane: LaneIndex, zCell: number): string {
    return `${lane}:${zCell}`;
  }

  private zCellsFor(zStart: number, zEnd: number): number[] {
    const c0 = Math.floor(zStart / this.cellDepth);
    const c1 = Math.floor(zEnd / this.cellDepth);
    const out: number[] = [];
    for (let c = c0; c <= c1; c++) out.push(c);
    return out;
  }

  insert(entry: GridEntry) {
    this.byId.set(entry.id, entry);
    for (const c of this.zCellsFor(entry.zStart, entry.zEnd)) {
      const k = this.keyFor(entry.lane, c);
      let arr = this.cells.get(k);
      if (!arr) {
        arr = [];
        this.cells.set(k, arr);
      }
      arr.push(entry);
    }
  }

  remove(id: number) {
    const e = this.byId.get(id);
    if (!e) return;
    this.byId.delete(id);
    for (const c of this.zCellsFor(e.zStart, e.zEnd)) {
      const k = this.keyFor(e.lane, c);
      const arr = this.cells.get(k);
      if (!arr) continue;
      const idx = arr.findIndex((x) => x.id === id);
      if (idx >= 0) arr.splice(idx, 1);
      if (arr.length === 0) this.cells.delete(k);
    }
  }

  clear() {
    this.cells.clear();
    this.byId.clear();
  }

  /** Entries overlapping `[zStart, zEnd]` on `lane`, deduped. */
  query(lane: LaneIndex, zStart: number, zEnd: number): GridEntry[] {
    const out: GridEntry[] = [];
    const seen = new Set<number>();
    for (const c of this.zCellsFor(zStart, zEnd)) {
      const arr = this.cells.get(this.keyFor(lane, c));
      if (!arr) continue;
      for (const e of arr) {
        if (seen.has(e.id)) continue;
        if (e.zEnd >= zStart && e.zStart <= zEnd) {
          seen.add(e.id);
          out.push(e);
        }
      }
    }
    return out;
  }

  /** Remove fully-contained entries in [zStart, zEnd] across all lanes. */
  clearWindow(zStart: number, zEnd: number): number[] {
    const removed: number[] = [];
    for (const e of Array.from(this.byId.values())) {
      if (e.zStart >= zStart && e.zEnd <= zEnd) {
        removed.push(e.id);
        this.remove(e.id);
      }
    }
    return removed;
  }

  size(): number {
    return this.byId.size;
  }
}
