# paycheck-planner-192: keyboard no longer springs back when the date sheet closes

## What changed and why
- `AppDatePicker.handlePress` calls `Keyboard.dismiss()` before it pushes `/date-picker` (and before
  Android's dialog). iOS remembers the first responder when a sheet is presented and hands it back
  when the sheet goes away, so a focused Pay amount got its number pad back over "Add income source"
  after Done, Cancel or a swipe down. Blurring the field first leaves nothing to restore.
- One component, so the Settings reminder time field gets the same behaviour.

## Verified (Runner 1, iPhone 17 Pro, iOS 27.0, dev build on Metro)
- Scratch flow name → amount (number pad up) → Monthly → First pay date → Done: no keyboard after the
  sheet closes, button fully visible. Same after Cancel and after swiping the sheet down; the next
  tap on "Add income source" saved the source.
- Same flow on `main`'s `AppDatePicker`: number pad back up over the button (bug reproduced).
- Recording of opening the sheet with the number pad up: the pad slides down, the form does not move.
- Light mode: Settings (mock Pro, Unpaid bill reminder on) → time field opens the time sheet, Done
  closes it. Editing an income source: tapping Name after the date sheet still brings the keyboard up.
- `bunx tsc --noEmit`, `bun run lint` clean.

## Not verified
- Android: `DateTimePickerAndroid` is a dialog; dismissing the keyboard first is harmless there but was
  not run on an emulator.

## Pitfall
- Maestro: income rows are one combined accessibility element (match `.*Brightline.*`), and a
  `\d+:\d\d` pattern also matches the status bar clock.
