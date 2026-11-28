# paycheck-planner-203: Pro delete, Undo and amount Save no longer wait on the 12-month list

## What changed and why
- Every store change rebuilt every paycheck item and re-rendered every mounted card (~50 on Pro, all rows stay
  mounted). Now `createPaycheckReuse` (`paycheckMonths.ts`) hands back last time's item when its JSON is equal,
  `PaycheckCard` is `memo`, and `usePaycheckCardRenderer` reads `assignments` at tap time, so a Save renders 1 card.
- `useCountUp` reads `navigation.isFocused()` when a value changes instead of `useIsFocused()`: every count on
  Paychecks re-rendered on each focus change, ~180 ms (dev) between a sheet's Save and its dismiss.
- Paychecks feeds the list through `useDeferredValue(useValueAfterCounts(live))`:
  - `useDeferredValue`: a focused change (the sheet's write, which lands just after `router.back()`) renders in the
    background, so the dismiss starts first.
  - `useValueAfterCounts` (new hook) + `afterCounts` (useCountUp.ts): on a hidden tab, a change waits until the
    counts it set off have finished (checked on the next frame), then applies; focus catches up at once.
- Measured why `useDeferredValue` alone was not enough (React `Profiler`, temporary logs): after deleting a source
  the deferred render was 47 ms, but its commit (unmounting ~25 cards: ~125 `ReanimatedSwipeable`s, Reanimated
  styles, effects) blocked the JS thread ~1.2 s, and no count frame ran in between. Undo: 610 ms render, then the
  same commit. A commit cannot be time-sliced, so the work now runs after the count instead of during it.
  Swipeables were about half that cost; the rest of the card the other half.

## Verified (Runner 1, dev build on Metro, sample data, mock-store Pro, recorded and read at 20 fps)
- Income → swipe Brightline → trash: closes and fades ~7 frames after the tap; "Per month" $8,590 → $8,006 →
  $6,564 → $5,563 → $4,759 → $4,535 → $4,329 → $4,300 (7 frames). Count ticks ran every ~17 ms, uninterrupted.
- Undo: $4,300 → $5,451 → $6,678 → $7,308 → $8,121 → $8,429 → $8,559 → $8,589 → $8,590 (9 frames); a swipe right
  after opened the row. (`main`: still short of $8,590 after 2.2 s.)
- Paychecks → Car Registration amount → Save: press dim → sheet moving in 6–8 frames (`main`: 28). The same
  sheet from the pay date screen measures 8 frames with Maestro's press; one card re-rendered.
- Pay date screen Save: "Left over" counted $1,117.20 → $1,119.00 (#187).
- Expenses → delete Groceries → Paychecks tab: hero $1,468.15 and "1 of 4 paid" from the first transition frame (HAU-903).
- `bunx tsc --noEmit`, `bun run lint` clean; core Maestro suite: see the PR.

## Pitfalls / follow-ups
- A Paychecks update after a change on another tab now costs ~1.2 s of JS (dev) right after the count. It used to
  cost the same, but during the count. Making cards cheaper to mount (swipeables created on first touch) would shrink it.
- Android not checked (Mac job); the change is plain JS.
- Lesson: `useDeferredValue` slices only the render. Profile the commit (`Profiler` `onRender` time vs the next
  passive effect) before relying on it for mount-heavy updates.
