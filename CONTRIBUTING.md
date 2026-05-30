# Contributing to HandFlow 3D

Thanks for considering a contribution. The project is intentionally small — please read this before opening a PR so the review goes smoothly.

## Ground rules

1. **No per-frame allocations.** Anything that runs inside `GameScene.update(dt)` must not call `new` on a `THREE.Mesh`, `THREE.Vector3`, or `THREE.Box3`. Pool, scratch, or hoist instead.
2. **Gestures must have hysteresis.** A new gesture type must define a debounce window (suggest ≥ 100 ms) and an enter-threshold that differs from its exit-threshold. Otherwise lane swaps will jitter at the boundary.
3. **Tests first for game state.** `Score`, `Difficulty`, `CollisionGrid`, `Revive`, and `Gestures` are all pure modules. New behaviour goes in via a failing vitest case first.
4. **Original assets only.** Don't import models or textures whose licence is unclear. Procedural geometry + matcap textures cover most of what the game needs.

## Local setup

```bash
git clone https://github.com/SiddharthFulia/handflow-3d
cd handflow-3d
npm install
npm run dev
```

Before pushing:

```bash
npm run typecheck
npm test
npm run build
```

For Playwright (only needed if you touched scene init or HUD wiring):

```bash
npx playwright install chromium
npm run e2e
```

## Project layout

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## PR checklist

- [ ] `npm run typecheck` is clean
- [ ] `npm test` is green
- [ ] No `new THREE.<anything>(...)` introduced inside an `update()` hot path
- [ ] Updated `CHANGELOG.md` under `[Unreleased]`
- [ ] Updated `docs/` if behaviour or controls changed

## Reporting bugs

Open an issue with:
- Browser + OS + GPU (`chrome://gpu` excerpt is great)
- Whether camera permission was granted
- Console output (any WebGL warning, MediaPipe init error)
- Reproduction steps
