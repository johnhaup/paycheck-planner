# paycheck-planner-191 Pay date push: the bar arrives with the screen (2026-11-27)

## What changed and why
- The fully empty bar from the issue never reproduced (first run: 12 recorded pushes in many states).
  What did: with the screen's first render 600 ms late, "Mark all paid" popped in after the slide,
  because it was set by `<Stack.Screen options>` inside `PayDateDetail`.
- `app/_layout.tsx`: `pay-date-detail` options are now a function of the route. Title, Back and
  `headerRight` are declared there; `headerRight` is set when the paycheck (route params
  `payDate`, `sourceId`) has unpaid bills, read once from `useStore.getState()`.
- `src/components/payDateDetail/MarkAllPaidButton.tsx`: the button (bar and embedded variants), moved
  out of `PayDateDetail`; renders nothing with no unpaid bills.
- `PayDateDetail` no longer renders `<Stack.Screen>`. It calls `navigation.setOptions` only when
  "has unpaid bills" flips after the push (mark all paid, un-pay a bill, assign a bill), so no empty
  glass pill is left and the button comes back.
- `src/utils/paycheckBills.ts` (+ `usePaycheckBills` hook, `paycheckBills.test.ts`): the bill
  derivation shared by the screen, the button and the route options (moved from `PayDateDetail`).

## Verified (Runner 1, iPhone 17 Pro, iOS 27.0, dev build, sample data)
- tsc, lint, `bun test` (43 pass), `.maestro/qa/paychecks.yaml`.
- Recording with a temporary 600 ms busy-wait at the top of `PayDateDetail` (removed): Back and
  "Pay date" are in the bar on the first frame of the slide, "Mark all paid" slides in with it, bar
  complete when the screen rests; nothing pops in after. Same without the delay, in light mode.
- Back: the bar slides away with the screen, the gear and large title return as before.
- Mark all paid: button leaves the bar (no empty pill); un-paying one bill brings it back.
- Duo (temporary "Duo Runner 1", iOS 27.1, unfolded on its side): embedded Pay date unchanged,
  "Mark all paid" in the summary, works and hides when all are paid. Duo deleted afterwards.

## Not verified
- The original fully empty bar (never reproduced; earlier run tried sample data, repeated pushes,
  after Settings/Currency, after tab switch with collapsed title, cold relaunch, light, edge swipes). Not recorded: Reduce Motion on, a
  20+ bill paycheck, a tap right after a month-pill jump, a loaded Mac. The 600 ms delay stands in
  for a slow first render.
- Android (options-function path is cross-platform; not run here).

## Pitfalls
- Point taps on header glass buttons (Settings close X) don't land with Maestro; swipe the sheet down.
