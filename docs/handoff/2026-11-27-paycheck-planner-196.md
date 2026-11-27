# #196 Paychecks: the header never rests half-collapsed (2026-11-27)

## What changed and why
- `app/(tabs)/(paychecks)/index.tsx`: inside the collapse distance below the collapsed title
  (`0 < pastTitle < collapseDistance`) the header rides with the list and `collapse` equals
  `pastTitle / distance`, so a list resting there showed the hero faded, the bars gone and bare
  labels under ~115 pt of blank space. New `settleHeader` worklet: when the list comes to rest there
  it scrolls (animated `scrollToOffset`, through `scheduleOnRN`) to the nearer finished state:
  `-pinTop` (whole header out, title collapsed) when `collapse < 0.5`, `distance - pinTop` (pills under
  the bar, the first row under them) otherwise. The scroll handler moves `collapse` along. Outside
  that range it runs the old `finishCollapse` (HAU-858) unchanged.
- Rest = `onEndDrag` with zero velocity, or `onMomentumEnd` (a drag with velocity waits for its
  momentum). The animated settle ends in `onMomentumEnd` too, at an end, where it does nothing.
- Jumps are untouched (`jumping` guard); a collapsed pill jump lands at exactly `distance - pinTop`.

## Ruled out
- `snapToOffsets`: RN iOS (`RCTEnhancedScrollView`) clamps the target to `MAX(0, …)`, and the list's top
  is negative under the large title. With `snapToEnd={false}` a fling from above the last offset still
  stops on it, so a fling down from the top would have stopped at the pills.

## Verified (Runner 1, iPhone 17 Pro, iOS 27.0, dev build on Metro, sample data)
- tsc and lint clean. `.maestro/qa/paychecks.yaml` passes (includes the #194 pill tap and HAU-854's
  short scroll back).
- Recording, slow 150 pt drag from the top (dark): released mid-collapse, about 200 ms later the
  header is all out under the collapsed title; no frame at rest has the blank band.
- Two screens down, back up short of the top: settles on the pills. Back drags of 70 to 105 pt from
  there settle back to the pills; a 175 pt back drag settles with the header out.
- Fling to top (lands on the large title) and fling down (glides to the end) as before, no end jump.
- Light mode: same two rest states. Welcome (empty) state: a drag leaves it unchanged.

## Not verified
- Android (same JS; `pinTop` 0, so the range is `0..distance`), iPhone Duo (no large title there,
  `pinTop` 0), Reduce Motion (the settle is UIKit's scroll animation, not Reanimated).
