# Android: amount sheet's Save clears the number pad (#184)

- `src/components/AmountSheet.tsx`: on Android the container keeps `useBottomPadding()` with the
  keyboard up (it was dropped while the keyboard showed) and `maxHeight` no longer subtracts the
  keyboard. iOS code path is unchanged.
- Why: react-native-screens 4.30 lifts a fit-to-contents formSheet by (keyboard height - nav bar
  inset) and lets the nav-bar-sized padding slide behind the keyboard (`SheetAnimationCoordinator`
  `calculateKeyboardShiftHidingBottomInset`). Without that padding the content was not lifted at all.
  Padding the sheet by the keyboard height myself double counted (sheet floated with a big gap).

## Verification
- Release APK (`EXPO_PUBLIC_STORE_DEMO=1`, Pro via `paycheck-planner://demo`) on the `runner` AVD,
  3-button nav, tap a bill amount on a paycheck card. Keyboard top ~y 2090.
  - 1.0: Save fully visible, flush above the pad (screenshot).
  - 1.3: Save bounds [53,1914][1228,2047]; with a custom amount Save + "Use default amount" both above the pad.
- Baseline reproduced before the change (Save half under the pad).
- `bunx tsc --noEmit`, `bun run lint` clean.
- Not checked: iOS (not changed), the paycheck-amount sheet separately (same component), Maestro.

## Pitfall
- Gradle's JS bundle task caches on inputs, not env: after changing `EXPO_PUBLIC_*` rerun with
  `:app:createBundleReleaseJsAndAssets --rerun`.
