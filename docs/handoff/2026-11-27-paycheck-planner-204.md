# paycheck-planner-204 Pay date push: the bar no longer pops in after the screen lands (2026-11-27)

## What changed and why
- Pay date (`pay-date-detail`) moved from the root stack into the Paychecks tab's stack:
  `app/pay-date-detail.tsx` → `app/(tabs)/(paychecks)/pay-date-detail.tsx`, its options (title, Back,
  "Mark all paid" from the route params, `headerLargeTitle: false`) moved from `app/_layout.tsx` to
  `app/(tabs)/(paychecks)/_layout.tsx`. `router.push("/pay-date-detail")` is unchanged.
- Cause: the root stack hides its bar for `(tabs)`, so the push had to unhide it. lldb (earlier run)
  showed `updateViewController` setting title, Back and right items on the pushed item at push time, yet
  on some first pushes after a cold launch iOS 27 drew the bar empty (gear gone on frame 1) until ~0.6 s
  after the slide. In the tab's stack the bar is already up, so UIKit cross-fades the items with the slide.
- Visible change: the tab bar stays on Pay date (standard iOS drill-down). The list scrolls clear of it;
  `useBottomPadding` is dropped there (tab screens never add the inset, HAU-181).

## Verified (Runner 1, iPhone 17 Pro, iOS 27.0, dev build on Metro, sample data)
- Repro on `main`: cold launch → first push, 20 fps, blank bar for ~11 frames in 2/10 (earlier run) and 1/6
  (this run). Warm pushes on `main` never reproduced, at idle or under full CPU load.
- After: cold launch → first push 8/8 dark and 4/4 light with no blank-bar frame; three warm pushes in
  dark and in light: "Pay date", Back and "Mark all paid" fade in over the first ~5 frames of the slide.
  Back: items fade with the pop, large title and gear return.
- Screens at rest (dark): bar right, tab bar over the list, "Add one-time expense" above it at the end.
- `.maestro/qa/` 6/6 on the dev build. `bunx tsc --noEmit`, `bun run lint` clean.

## Not verified
- Android (Mac job): Pay date now keeps the bottom tab bar there too.
- iPhone Duo: the screen's wide-width `router.back()` into the side-by-side view is unchanged code, not run.

## Pitfalls
- Blank-bar detector and recording scripts: count frames whose bar strip is flat while the body is not.
  Reproducing needs a cold launch (`launchApp: stopApp: true`), then the first push.
