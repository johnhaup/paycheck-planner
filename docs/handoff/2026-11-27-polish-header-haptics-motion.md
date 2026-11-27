# Polish: collapsed header survives a month tap, haptic and motion gaps (2026-11-27)

John's interactive polish session, no ticket.

## What changed and why
- `app/(tabs)/(paychecks)/index.tsx`: every tapped jump (pill, chart bar, Today, short line) brought the
  whole header out (`collapse` to 0), so picking a month from the collapsed pills redrew the hero and
  chart each time. A tapped jump now keeps the header as it is: with `collapse >= 0.5` it goes to 1 and
  the month's first row lands under the pills (`viewOffset = pinTop + COLLAPSED_HEADER_HEIGHT`, row 0
  included, so no large-title glide); below 0.5 it comes out as before. Launch and tab return are
  unchanged (whole header out). This reverses the "every jump lands with the whole header out" line in
  brain `decisions.md` for tapped jumps.
- Haptics added where a commit had none: add/remove a bill on the pay date screen and the swipe
  mark-paid action (`hapticTap`), Undo on a toast (`hapticTap`), sort choice, language/currency row,
  date sheet Done (`hapticSelection`), sample data, cloud merge and delete-copy success
  (`hapticSuccess`), Restore with nothing to restore and a denied notification permission
  (`hapticWarning`).
- Motion: the "Short by / Move a bill" row on a card and on the pay date summary, the one-time expense
  button/form swap and Settings' reminder options are `AppFormSection`s (fade, and the rows below
  spring); Settings is wrapped in `LayoutAnimationConfig skipEntering`. `AppEmptyState` fades in.

## Verified (Paycheck Planner Dev sim, iOS 27, dev build on Metro, sample data, dark)
- tsc and lint clean. `.maestro/qa/` paychecks, smoke, settings, income pass.
- Recording, frame by frame: collapsed, tap Nov pill then Dec pill: pills stay put, rows fade and land
  with the month title under the pills; a short scroll back stays collapsed.
- Settings: payday reminder on/off, options fade and the rows below glide. One-time form opens/closes.

## Not verified
- Android, iPhone Duo, light mode, Reduce Motion. Haptics cannot be felt on a simulator.
- The Short row's fade and the empty-state fade were not watched frame by frame.
- Expanded-header jumps (chart bar from the top, Today) were not re-recorded; that path is unchanged.

## Pitfalls
- `.maestro/qa/paychecks.yaml` tapped the selected pill by text while collapsed: Maestro taps the
  middle of the pill's accessibility frame (the whole chart column), which is under the navigation bar
  and scrolls the list to the top. The old "jumps back to the top" assertion passed because of that,
  not because of the app. The step now taps by point and asserts the header stays collapsed.
- Left alone: paywall motion (spinner and footer swap), bill amounts counting in rows, section totals.
