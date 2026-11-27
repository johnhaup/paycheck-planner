# Android: modal bottom buttons clear the navigation bar (#182)

- New `src/hooks/useBottomPadding.ts`: on Android `{ paddingBottom: insets.bottom + spacing.lg }`,
  on iOS `undefined` (each style keeps its own `spacing.bottom`, so iOS is unchanged). This is the
  HAU-865 Settings rule, now shared.
- Used by Settings (replaces its inline version), Expense form, Income form, Pay date
  (`app/pay-date-detail.tsx` only; the Paychecks pane passes `embedded` and does not get it),
  `SettingsChoiceList` (Language, Currency), Move bill sheet, and `AmountSheet` (expense and paycheck
  amount) while the keyboard is closed (the keyboard covers the nav bar, so no inset then).
- Paywall footer: Android `insets.bottom + spacing.lg` (was `spacing.md`, 8dp above the bar); iOS keeps md.
- Decision written to brain `apps/paycheck-planner/decisions.md` (2026-11-27).

## Verification
- `bunx tsc --noEmit`, `bun run lint` clean.
- Release APK (`EXPO_PUBLIC_STORE_DEMO=1` for Pro through `paycheck-planner://demo`) on the `runner`
  AVD. Bottom of the last control vs. navigation bar top, px at 2.625 density:
  - 3-button, 1.0: Pay date "Add one-time expense" 2232 vs 2274 (was 2295); edit Groceries
    "Update expense" 2230 vs 2274 (was 2293); Settings footnote 2232; Language list 2232; paywall
    Restore 2232 (was 2253); amount sheet Save 2232 (was 2347, under the bar); Move 2232.
  - Gesture nav, font 1.3: new expense "Add expense" 2292 vs 2337.
  - Income form does not scroll even at font 2.0 (button ends ~1980); same hook as Expense form.
- Not checked: iOS (no code path changes there: hook returns undefined), light/dark both fine (mode-independent).

## Follow-ups
- #184: Android amount sheet opens with the number pad covering Save (pre-existing, not touched here).

## Pitfall
- Sheets (`formSheet`) on Android run under the navigation bar too, not only full-screen modals.
- Changing `font_scale` recreates the activity and closes open modals; reopen before measuring.
