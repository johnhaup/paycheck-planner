# paycheck-planner-188 Paychecks: a tapped jump across the large title glides (2026-11-27)

## What changed and why
- Cause: a tapped jump that crossed the top of the list landed with one unanimated scroll, so UIKit
  switched the large title in one frame and the pinned header (sitting under the expanded title at
  the top, under the collapsed bar once pinned) stepped by the title's height, 61-62 pt on the iPhone
  17 Pro sim (the issue measured ~25 pt from another frame pair), both directions.
- `app/(tabs)/(paychecks)/index.tsx`, tapped jumps only (`jumpTo(..., true)`):
  - From under the expanded title to any row but the first: while the rows fade out, the list scrolls
    with UIKit's animation to the collapsed-title position (`-pinTop`). There the header is not yet
    pinned (pinShift 0), so it rides up with the content natively while UIKit collapses the title.
    The scroll handler reports arriving (`toBar`), and the jump lands unseen from there as before,
    where the pinned header sits exactly where it already is. Fallback lands after 800 ms.
  - Back to the first row (Go to this month, Nov bar/pill) with the title collapsed: the hidden list
    first lands at `-pinTop` (header on screen where it is pinned), then shows the rows and scrolls
    with animation to the top, so the title comes out and the header glides down (`gliding`: no
    rejump and no relanding on a header relayout during it).
  - Opening jump, tab return and jumps that stay below the title are unchanged.

## Verified (Runner 1, iPhone 17 Pro, iOS 27.0, dev build on Metro, sample data, free)
- tsc and lint clean; `.maestro/qa/paychecks.yaml`, `smoke.yaml` and `pro.yaml` pass.
- Recordings of 3 x (Dec bar, Go to this month) from the top, per-frame hero position by matching
  the hero band's row profile (scratch `measure.py`): main steps 62 pt in one frame; branch max step
  6 pt per frame (~16 ms) over 3 recordings, dark and light (one 10 pt step came after a 55 ms gap in
  the recording at load ~40, a dropped frame, not a jump). Title shrinks/grows over ~15 frames.
  No frame shows rows in the header's place or the hero under the bar.
- Collapsed pill taps (Dec pill mid-list, Nov pill after scrolling): the header comes out as before;
  the Nov one then glides to the top with the large title.

## Not verified
- Android (no large title; `pinTop` is 0 there, so neither path runs), iPhone Duo (no large title on
  regular width; folded `pinTop` is 0), Reduce Motion: UIKit's animated scroll plays regardless (~0.3 s, 62 pt);
  the jump used to snap there. Left as is: a snap is what the ticket removes.

## Pitfalls
- A worklet scroll handler must not capture a `useCallback` declared below it (TDZ); go through a ref
  (`reachedBarRef`), as `rejump` does.
