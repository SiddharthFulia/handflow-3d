# HandFlow 3D

A browser 3D endless-runner controlled by **hand gestures**. No keyboard needed — just lift your palm in front of your webcam, swipe it left or right to switch lanes, raise it for a jump, drop it for a roll. Built with Three.js + React + MediaPipe Tasks Vision.

![HandFlow 3D screenshot](docs/screenshot-placeholder.png)

> Original project. Not affiliated with or derived from any commercial runner game.

## Why

Hand-tracking is no longer a research toy — MediaPipe's WASM backend ships 21-landmark hand inference at 30+ FPS on a mid-range laptop. HandFlow 3D is a complete, well-tuned example of how to wire that into a real-time game loop without dropping a frame.

## Quick start

```bash
git clone https://github.com/SiddharthFulia/handflow-3d
cd handflow-3d
npm install
npm run dev
```

Open `http://localhost:5173`, allow camera access, lift one hand into frame.

## Controls

| Gesture                 | Action          | Keyboard fallback |
| ----------------------- | --------------- | ----------------- |
| Palm on left third      | Move to L lane  | `←`               |
| Palm centred            | Centre lane     | (auto)            |
| Palm on right third     | Move to R lane  | `→`               |
| Palm raised (above eye) | Jump            | `↑` or `Space`    |
| Palm lowered (below chest) | Roll / slide | `↓`               |
| Fist                    | Pause           | `Esc`             |

Keyboard wins whenever both inputs fire on the same frame, so you can demo headless.

## Difficulty curves

Four built-in curves, selectable on the start screen:

| Curve   | Start speed | Top speed | Obstacle density | Coin density |
| ------- | ----------- | --------- | ---------------- | ------------ |
| easy    | 8 u/s       | 16 u/s    | 0.35             | 0.7          |
| medium  | 10 u/s      | 22 u/s    | 0.55             | 0.6          |
| hard    | 12 u/s      | 28 u/s    | 0.75             | 0.5          |
| classic | 9 u/s       | 30 u/s    | 0.6              | 0.6          |

Speed ramps follow `start + (top - start) * tanh(t / horizon)` so you never feel a sudden wall.

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Short version:

- **Three.js scene** — chase camera, three lanes, pooled obstacle / coin meshes, recycled track tiles
- **MediaPipe HandLandmarker** — running in its own rAF loop, results read by `Gestures.ts` with hysteresis
- **InputMux** — merges hand + keyboard into a single per-frame intent
- **State** — hand-rolled subscribable store; no zustand, no redux
- **Score / Combo / Revive** — pure state classes, fully covered by unit tests

## Testing

```bash
npm test          # vitest unit tests
npm run e2e       # Playwright: boot scene, run 10s, expect score > 0
npm run typecheck # tsc --noEmit
```

## Performance notes

See [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md). Highlights:

- Zero allocation in the per-frame update loop (object pooling for obstacles + coins)
- Frustum-aware track recycling — tiles behind the camera are reused, not destroyed
- MediaPipe runs at ~30 FPS in a decoupled loop; the render loop never blocks on landmark inference
- Bloom is gated behind a `?fx=hi` query param so low-end hardware stays smooth

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). PRs welcome — particularly new difficulty curves, additional gesture types (pinch, peace-sign, finger-count), or alternate art passes (toon, low-poly desert, etc).

## License

MIT — see [`LICENSE`](LICENSE).
