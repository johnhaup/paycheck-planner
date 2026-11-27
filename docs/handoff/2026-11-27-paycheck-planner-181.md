# Android: + button no longer counts the navigation bar twice (#181)

- `src/components/AppFab.tsx`: on Android the bottom safe-area inset is 0, so the button sits
  `spacing.lg` above the tab bar (the tab screen already ends above tab bar + nav bar). iOS still
  uses `insets.bottom + spacing.lg`, unchanged. The hook is still called unconditionally (lint).
- Lists keep their bottom padding (`fabSize + spacing.bottom`), sized for a button 16dp above the
  tab bar, so the last row now clears the button.

## Verification
- `bunx tsc --noEmit` and `bun run lint` clean.
- Release APK on the `runner` emulator (Pixel, 3-button nav): + sits ~16dp above the tab bar; Expenses scrolled to the end shows Car Registration "$168.00 / one-time" fully clear. Gesture nav and iOS not checked here.

## Pitfall
- Android's `useSafeAreaInsets().bottom` is the navigation bar even when the screen already ends
  above it; do not add it to anything positioned inside a tab screen.
