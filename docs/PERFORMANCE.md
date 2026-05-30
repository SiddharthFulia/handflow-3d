# Performance Notes

HandFlow 3D ships a few non-obvious choices to keep the frame budget healthy
even with a hand-tracking thread running alongside WebGL.

## 1. Zero allocation in the per-frame loop

Anything inside `GameScene.updateFixed(dt)` runs 60× per second. We rely on
the V8 / SpiderMonkey nursery to collect short-lived `THREE.Vector3`s — but
once you start spawning two or three per frame, a major GC inevitably hits.

Concrete avoidance moves:

- `ChaseCamera` keeps two pre-allocated `Vector3` scratch fields and reuses
  them every frame. Never `new Vector3()` in `follow()`.
- `Player` keeps `box`, `boxMin`, `boxMax` Vector3/Box3 fields and refreshes
  them in place.
- `Tracks`, `Obstacles`, `Coins` all use **object pools**. Spawning means
  flipping `mesh.visible` true and assigning new transforms; recycling does
  the inverse. No `new Mesh(...)` in the hot path.
- `Materials` is a single cache keyed by name. Every barrier shares one
  `MeshStandardMaterial`, which lets three.js batch them.

If you're sending a PR, the contributing checklist includes a "no `new` in
update()" rule. ESLint can't catch it (too dynamic), so it's review-gated.

## 2. Frustum-aware track recycling

`Tracks.advance(delta, cameraZ)` checks each tile's z-position against the
camera and moves any tile that's drifted past `cameraZ + 4` to the front of
the queue. Three.js culls invisible tiles automatically thanks to
`Object3D.frustumCulled = true`, but the recycling step is what keeps the
total tile count bounded at 18.

The same logic applies to obstacles and coins in their respective files.

## 3. MediaPipe runs decoupled

`HandTracker` owns its own `requestAnimationFrame` loop. It calls
`landmarker.detectForVideo(video, now)` and pushes results to a listener.
This means:

- A slow landmark frame (e.g. 35 ms on integrated graphics) doesn't slow the
  WebGL frame — they're independent rAF callbacks.
- We process one hand only (`numHands: 1`), and use GPU delegate for ~2-3× speedup over CPU.
- The `Gestures` state machine is per-landmark-frame, so if MediaPipe drops to 20 FPS, lane swaps just feel slightly less responsive — they don't get queued up.

## 4. Optional bloom

Bloom is gated behind `?fx=hi`. Default is straight `renderer.render()` with
`LinearToneMapping`. Saves an extra render target on low-end hardware.

## 5. devicePixelRatio cap

`renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` — at DPR 3
(some Android phones) the cost of full-resolution rendering would dominate.
We accept slight aliasing for the sake of consistent 60 FPS.

## Benchmark snapshot (M1 Pro, Chrome 120, no fx=hi)

| Metric               | Value           |
| -------------------- | --------------- |
| Median frame time    | 7.8 ms          |
| 95th percentile      | 11.2 ms         |
| MediaPipe inference  | 14 ms (GPU)     |
| Heap delta over 60s  | < 4 MB (no growth trend) |

Numbers will vary widely on integrated graphics. Use the in-engine FPS flag
(`window.__handflow_fps`) to compare on your own hardware.
