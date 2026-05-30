// On same-frame conflict keyboard wins — deterministic for e2e / demos.

import type { GestureIntent } from './Gestures';
import type { Gestures } from './Gestures';
import type { KeyboardFallback } from './KeyboardFallback';

const MERGE_WINDOW_MS = 30; // same-frame at 30 FPS

interface PendingIntent {
  intent: GestureIntent;
  source: 'kbd' | 'hand';
  tMs: number;
}

export class InputMux {
  readonly keyboard: KeyboardFallback;
  readonly gestures: Gestures;
  private pending: PendingIntent | null = null;
  private listeners: Set<(intent: GestureIntent) => void> = new Set();

  constructor(keyboard: KeyboardFallback, gestures: Gestures) {
    this.keyboard = keyboard;
    this.gestures = gestures;
    keyboard.onIntent((i) => this.ingest(i, 'kbd'));
    gestures.onIntent((i) => this.ingest(i, 'hand'));
  }

  private ingest(intent: GestureIntent, source: 'kbd' | 'hand') {
    const now = intent.tMs;
    if (!this.pending) {
      this.pending = { intent, source, tMs: now };
      // microtask flush lets the other input arrive in the same frame
      queueMicrotask(() => this.flush(now));
      return;
    }
    if (this.pending.source === 'hand' && source === 'kbd') {
      this.pending = { intent, source, tMs: now };
    }
  }

  private flush(arrivalMs: number) {
    if (!this.pending) return;
    void arrivalMs;
    const out = this.pending.intent;
    this.pending = null;
    this.listeners.forEach((l) => l(out));
  }

  onIntent(l: (intent: GestureIntent) => void): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }
}
