# Controls

## Hand gestures (primary)

| Action       | How                                                        |
| ------------ | ---------------------------------------------------------- |
| Lane left    | Move your palm into the **left third** of the camera frame |
| Lane centre  | Palm in the **middle third**                               |
| Lane right   | Palm in the **right third**                                |
| Jump         | Raise palm above the **top 30%** of the frame              |
| Roll / slide | Drop palm into the **bottom 25%** of the frame             |
| Pause        | Hold a **closed fist** for ~0.6 s                          |

### Thresholds

| Variable          | Default | Meaning                                          |
| ----------------- | ------- | ------------------------------------------------ |
| `enterLeft`       | 0.30    | palm-X to commit to left lane                    |
| `exitLeft`        | 0.40    | palm-X to leave left lane back to centre         |
| `enterRight`      | 0.70    | palm-X to commit to right lane                   |
| `exitRight`       | 0.60    | palm-X to leave right lane back to centre        |
| `jumpY`           | 0.30    | palm-Y above this → jump (image y, 0 = top)      |
| `rollY`           | 0.75    | palm-Y below this → roll                         |
| `dwellMs`         | 80      | min ms between any two intents                   |
| `jumpCooldownMs`  | 350     | match the player jump animation length           |
| `rollCooldownMs`  | 350     | match the player roll animation length           |
| `fistDwellMs`     | 600     | hold-to-pause window                             |

The asymmetric enter/exit thresholds are the hysteresis — without them, a
palm sitting exactly at 0.30 jitters between lanes every frame.

## Keyboard fallback

Used automatically if camera permission is denied or MediaPipe init fails.
Also overrides hand input if both fire on the same frame (deterministic for
e2e tests).

| Key        | Action     |
| ---------- | ---------- |
| `←` / `A`  | Lane left  |
| `→` / `D`  | Lane right |
| `↑` / `Space` | Jump    |
| `↓` / `S`  | Roll       |
| `Esc`      | Pause      |
