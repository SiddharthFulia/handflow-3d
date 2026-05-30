// Always wired so the demo works without camera grant. Emits the same
// GestureIntent shape as Gestures.ts so InputMux can merge them.

import type { GestureIntent } from './Gestures';

type Listener = (intent: GestureIntent) => void;

export class KeyboardFallback {
  private listeners: Set<Listener> = new Set();
  private currentLane: 0 | 1 | 2 = 1;
  private attached = false;
  private lastJumpAt = -Infinity;
  private lastRollAt = -Infinity;
  private readonly cooldownMs = 350;

  attach(target: Window) {
    if (this.attached) return;
    target.addEventListener('keydown', this.onKey);
    this.attached = true;
  }

  detach(target: Window) {
    target.removeEventListener('keydown', this.onKey);
    this.attached = false;
  }

  onIntent(l: Listener): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  private emit(intent: GestureIntent) {
    this.listeners.forEach((l) => l(intent));
  }

  private onKey = (e: KeyboardEvent) => {
    const t = performance.now();
    if (e.repeat) return;
    switch (e.key) {
      case 'ArrowLeft':
        if (this.currentLane > 0) {
          this.currentLane = (this.currentLane - 1) as 0 | 1;
          this.emit({ kind: 'lane', lane: this.currentLane, tMs: t });
        }
        e.preventDefault();
        break;
      case 'ArrowRight':
        if (this.currentLane < 2) {
          this.currentLane = (this.currentLane + 1) as 1 | 2;
          this.emit({ kind: 'lane', lane: this.currentLane, tMs: t });
        }
        e.preventDefault();
        break;
      case 'ArrowUp':
      case ' ':
      case 'Spacebar':
        if (t - this.lastJumpAt > this.cooldownMs) {
          this.lastJumpAt = t;
          this.emit({ kind: 'jump', tMs: t });
        }
        e.preventDefault();
        break;
      case 'ArrowDown':
        if (t - this.lastRollAt > this.cooldownMs) {
          this.lastRollAt = t;
          this.emit({ kind: 'roll', tMs: t });
        }
        e.preventDefault();
        break;
      case 'Escape':
        this.emit({ kind: 'pause', tMs: t });
        e.preventDefault();
        break;
    }
  };

  syncLane(lane: 0 | 1 | 2) {
    this.currentLane = lane;
  }
}
