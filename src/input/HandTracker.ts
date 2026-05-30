// Runs its own rAF loop — inference is 15-25ms and must not block WebGL.

import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { HandLandmarks, Landmark } from './Gestures';

const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

export interface HandTrackerOptions {
  wasmBase?: string;
  modelUrl?: string;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
}

export type LandmarkCallback = (landmarks: HandLandmarks | null, tMs: number) => void;

export class HandTracker {
  private video: HTMLVideoElement;
  private opts: Required<HandTrackerOptions>;
  private landmarker: HandLandmarker | null = null;
  private stream: MediaStream | null = null;
  private rafHandle = 0;
  private cb: LandmarkCallback | null = null;
  private disposed = false;

  constructor(video: HTMLVideoElement, opts: HandTrackerOptions = {}) {
    this.video = video;
    this.opts = {
      wasmBase: opts.wasmBase ?? WASM_BASE,
      modelUrl: opts.modelUrl ?? MODEL_URL,
      minDetectionConfidence: opts.minDetectionConfidence ?? 0.5,
      minTrackingConfidence: opts.minTrackingConfidence ?? 0.5
    };
  }

  async init(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('getUserMedia unavailable');
    }
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
      audio: false
    });
    this.video.srcObject = this.stream;
    await this.video.play();

    const filesetResolver = await FilesetResolver.forVisionTasks(this.opts.wasmBase);
    this.landmarker = await HandLandmarker.createFromOptions(filesetResolver, {
      baseOptions: { modelAssetPath: this.opts.modelUrl, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: this.opts.minDetectionConfidence,
      minTrackingConfidence: this.opts.minTrackingConfidence,
      minHandPresenceConfidence: 0.5
    });

    this.loop();
  }

  onLandmarks(cb: LandmarkCallback) {
    this.cb = cb;
  }

  private loop = () => {
    if (this.disposed || !this.landmarker) return;
    const now = performance.now();
    try {
      const result = this.landmarker.detectForVideo(this.video, now);
      const raw = result.landmarks?.[0] as Landmark[] | undefined;
      if (raw && raw.length) {
        // mirror x so palm-x matches user POV (video is also CSS-flipped)
        const mirrored: HandLandmarks = raw.map((p) => ({ x: 1 - p.x, y: p.y, z: p.z }));
        this.cb?.(mirrored, now);
      } else {
        this.cb?.(null, now);
      }
    } catch (err) {
      // one bad frame must not kill the loop
    }
    this.rafHandle = requestAnimationFrame(this.loop);
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.rafHandle);
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.landmarker) {
      this.landmarker.close();
      this.landmarker = null;
    }
  }
}
