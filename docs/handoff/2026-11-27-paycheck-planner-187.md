# #187: Amount sheets keep their layout while they close; Left over counts

## What changed and why
- `app/paycheck-amount.tsx`, `app/expense-amount.tsx`: Save and the reset button ("Use usual amount" /
  "Use default amount") no longer write the store before `router.back()`. The write is handed to the new
  `useWriteOnClose()` (`src/hooks/useWriteOnClose.ts`), which runs it in the sheet's unmount cleanup.
- Before: the write re-rendered the still-mounted sheet, so its `override` / `isCustom` flipped and the
  reset button appeared (Save) or vanished (reset) while the sheet slid away, resizing it. And the pay
  date screen behind was still unfocused when the store changed, so `useCountUp` snapped "Left over"
  instead of counting (it snaps on unfocused screens by design, HAU-699/HAU-903).
- With the write on unmount nothing in the sheet changes during the dismiss, and the pay date screen is
  focused again when the store changes, so its amounts count. One fix for both symptoms; `useCountUp`
  and `AmountSheet` are unchanged.
- In practice React unmounts the sheet right after the pop while the native view keeps animating, so the
  count starts as the sheet starts down (no visible delay).
- Swipe-down dismiss without Save writes nothing (nothing pending), as before.

## Verified (Runner 1, dev build on Metro, sample data, mock-store Pro, recorded at 20 fps)
- Pay sheet, Feb 5 Brightline, 1980 → 2100 → Save: no frame shows "Use usual amount"; the sheet only
  moves down; Left over counts $1,510 → $1,546.49 → $1,589.61 → … → $1,630.
- Reopen (custom amount): "Use usual amount" shown at open; tap it: the button stays and the height holds
  until the sheet is gone; Left over counts $1,630 → $1,592 → … → $1,510.
- Bill sheet, Groceries 220 → 300 → Save: no "Use default amount" flash; $1,510 → $1,476 → … → $1,430.
  Reset: button stays through the dismiss; $1,430 → $1,456 → … → $1,510.
- Light mode: pay sheet with the reset button, Save ($883 → $1,003) and reset back to $883, screenshots.
- `bunx tsc --noEmit`, `bun run lint` clean. No unit test setup. Core Maestro suite not run.

## Pitfalls
- Maestro `inputText` right after the sheet opens can land before `selectAmount`'s selection (typed
  "21000"); wait for animations before typing in scratch flows.
- Android not checked (Mac job); the change is platform-neutral JS.
