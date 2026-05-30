# HandFlow 3D — Architecture

A 90-second tour of the codebase.

```
┌────────────────────────────────────────────────────────────────────┐
│  src/main.tsx              React entry — mounts <HandFlow/>        │
│  src/HandFlow.tsx          Top component, owns canvas + video      │
│                            element, instantiates GameScene + …     │
├─ scene/ ───────────────────────────────────────────────────────────┤
│  GameScene.ts              Renderer, fixed-step update loop        │
│  Player.ts                 Capsule mesh, lane snap, jump, roll     │
│  Tracks.ts                 Pooled, recycled 3-lane tile strip      │
│  Obstacles.ts              Pooled barriers/trains/ramps + grid     │
│  Coins.ts                  Pooled coin chains + magnet zone        │
│  Camera.ts                 Chase camera with damping + lookahead   │
│  Lighting.ts               Hemisphere + warm spot + Three.Fog      │
│  Skybox.ts                 Gradient sphere + horizon mountains     │
│  Materials.ts              Cached shared materials                 │
│  PostFx.ts                 (Optional) tone-mapping / bloom         │
├─ input/ ───────────────────────────────────────────────────────────┤
│  HandTracker.ts            MediaPipe HandLandmarker + camera       │
│  Gestures.ts               Landmarks → discrete intents (HYST.)    │
│  KeyboardFallback.ts       ←/→/↑/↓/Esc emit the same intents       │
│  InputMux.ts               Merge hand + keyboard, kbd wins ties    │
├─ game/ ────────────────────────────────────────────────────────────┤
│  State.ts                  Hand-rolled subscribable store          │
│  Score.ts                  Combo / distance / multiplier math      │
│  Difficulty.ts             tanh speed ramps, density tables        │
│  Revive.ts                 One free revive token per run           │
│  CollisionGrid.ts          Lane × z-cell collision lookup          │
├─ hud/ ─────────────────────────────────────────────────────────────┤
│  Score.tsx Combo.tsx PauseModal.tsx StartScreen.tsx GameOver.tsx   │
├─ assets/ ──────────────────────────────────────────────────────────┤
│  AssetManifest.ts          Procedural geometry fallbacks           │
└────────────────────────────────────────────────────────────────────┘
```

## Update loop

1. `rAF` callback measures real elapsed time → caps to 100 ms.
2. Accumulate into a fixed-step accumulator; pull as many `FIXED_DT = 1/60s`
   ticks out as fit. This decouples physics from monitor refresh.
3. Each fixed tick:
   - bump `elapsed`, read `speedAt(curve, elapsed)`
   - advance `Tracks`, `Obstacles`, `Coins` by `speed * dt`
   - try-spawn one obstacle + one coin-chain ahead
   - tick the `Player` (lane easing, jump arc, roll squash)
   - query `CollisionGrid` for hits on the player's lane
   - on hit: consume `Revive` if available, else `phase = 'gameover'`
   - publish snapshot to `Store` (React HUD re-renders)
4. Once per real frame: chase camera lerp, render via `PostFx`.

## Why a hand-rolled store?

The store is ~80 LOC. It does exactly two things:

- per-key listener sets so `<ScoreHud>` doesn't re-render when `combo` changes
- emits the current value on first subscribe so consumers don't need a manual read

Dropping zustand / redux saves ~30 KB and removes a peer-dep that wouldn't be
exercised. Easy to swap back in if the API outgrows this file.

## Hand-tracking pipeline

```
camera ─▶ <video> ─▶ MediaPipe HandLandmarker ─▶ raw 21 landmarks
                                                 │
                                                 │ mirror x (selfie → world)
                                                 ▼
                                            Gestures.process()
                                                 │
                                          { lane | jump | roll | pause }
                                                 │
                                            InputMux.ingest()
                                                 │  ← KeyboardFallback also feeds here
                                                 ▼
                                            Player.setLane / jump / roll
                                            Store.setPhase (pause)
```

`Gestures.process()` is pure (no I/O, no time-based side effects beyond what
the caller-supplied `tMs` implies), which is why the unit tests can fixture it
end-to-end with synthetic landmark sequences.

## File count + LOC ballpark

35+ source/test/doc files. Around 1,700 SLOC at first commit, including tests
and docs. See the `cloc` table in `docs/PERFORMANCE.md` for an exact count.
