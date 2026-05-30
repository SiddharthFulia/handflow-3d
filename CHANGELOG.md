# Changelog

All notable changes to HandFlow 3D are documented here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning follows [SemVer](https://semver.org/).

## [Unreleased]

### Added
- Initial public commit
- Three.js scene with three-lane endless track, pooled obstacles + coins
- MediaPipe HandLandmarker integration with palm-X → lane mapping, palm-Y → jump/roll
- Keyboard fallback (`←` `→` `↑` `↓` `Space` `Esc`)
- Four difficulty curves: easy, medium, hard, classic
- One-shot revive token per run
- Combo scoring with magnet zone
- Vitest unit tests for Difficulty, Gestures, Score, CollisionGrid
- Playwright e2e: boots scene, runs 10s, asserts score progression
- Subtle bloom post-process gated by `?fx=hi`
- Architecture, controls, and performance docs

[Unreleased]: https://github.com/SiddharthFulia/handflow-3d/commits/main
