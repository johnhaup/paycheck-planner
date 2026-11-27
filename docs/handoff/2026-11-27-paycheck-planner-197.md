# paycheck-planner-197: Paychecks resets as its tab is left, not as it comes back (2026-11-27)

## What changed and why
- `app/(tabs)/(paychecks)/index.tsx`, the tab effect: `goHome(false)` (this month, whole header out, decided in
  HAU-316) ran when the Paychecks tab came back. The native tab transition showed the old place (pills, December)
  for ~200 ms, then the list cut to the top and the hero, "in / assigned" line and chart highlight counted/faded
  from the old month, because the screen was focused by then.
- It now runs when Paychecks loses its tab to another tab. The hidden tab stays mounted and its scroll view and
  large title follow the jump unseen; `useCountUp` snaps there because the screen is not focused (HAU-699), and
  the chart's pill/bar timings (~300 ms) end long before the user can come back. Sheets and the pay date screen
  still leave the tab alone (`tab` is undefined while a root-stack route is on top).

## Verified (Runner 1, iPhone 17 Pro, iOS 27.0, dev build on Metro, sample data)
- Recorded at 20 fps (scratch flows, `simctl io recordVideo`, ffmpeg tiles): every frame of the slide-in
  shows the large title, November hero $1,270.15 (no count), the "$4,130.00 in · $2,859.85 assigned" line,
  the Nov bar highlighted and Nov 27 rows. Cases: scrolled to December → Income; → Expenses; December picked
  from the collapsed pills → Income; light mode → Income; left at the top → Income (unchanged).
- `.maestro/qa/paychecks.yaml` and `smoke.yaml` pass. `bunx tsc --noEmit`, `bun run lint` clean.

## Not verified
- Android (Mac job). Expo's Android native tabs keep the hidden tab mounted too, so the same path applies.
- A return quicker than ~300 ms could catch the chart pill's slide finishing; not seen in practice.

## Pitfall
- Resetting a hidden tab is what makes it invisible: anything done on focus is on screen from the first frame of
  the native tab transition.
