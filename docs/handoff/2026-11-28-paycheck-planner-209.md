# paycheck-planner-209: expenses flow reads Internet's slot instead of hardcoding "2nd" (2026-11-28)

## What changed
- `.maestro/qa/expenses.yaml` only; no app source. The sample data puts Internet on the slot
  of the next Brightline payday (`src/utils/demoData.ts`), so it is "1st" late in the month and
  "2nd" mid-month. Before the due-day edit the flow now copies Internet's schedule
  (iOS: the whole row `.*Internet.*paycheck each month.*`; Android: the `.*paycheck each month`
  text below "Internet") and an `evalScript` keeps the word before "paycheck each month" in
  `output.internetSlot`. After the due day is cleared, both the iOS and the Android assertion
  look for `${output.internetSlot} paycheck each month`, so they still check that the old
  slot came back (HAU-417) and the flow names no ordinal.

## Verified
- `Runner 1`, iOS dev build on Metro, `expenses` passes on 2026-11-28: slot read as "1st"
  (log: `Internet.*1st paycheck each month`), screenshot shows Internet "1st paycheck each month".
- Same flow with a temporary `Date` shim (a module imported first from `index.ts`, served by
  Metro, set to 2026-11-17; reverted, nothing committed): passes, slot read as "2nd", screenshot
  shows Internet and Car Payment on "2nd paycheck each month".
- `bunx tsc --noEmit`, `bun run lint` clean.
- Not run: the Android branch (Mac job). Its `copyTextFrom` uses the same `below: "Internet"`
  selector the existing Android assertion already used.

## Lesson
- A date shim works on the dev build without a rebuild: put the `Date` override in its own module
  and import it first from `index.ts` (imports hoist, so inline code after `import` runs too late).
