# paycheck-planner-201: payment links open in an in-app browser sheet

## What changed
- `src/utils/links.ts` `openPaymentLink`: http(s) links open with `expo-web-browser`
  `openBrowserAsync` and `presentationStyle: PAGE_SHEET` (SFSafariViewController on iOS, Custom
  Tabs on Android), so you can swipe the sheet down to get back to the same screen. Other schemes (`tel:`, `mailto:`, app links)
  still go through `Linking.openURL`. `normalizeLink` and the "could not open" alert are unchanged.
- A module flag ignores a second tap while the sheet is up: `openBrowserAsync` rejects when a
  browser is already presented, which would have shown the failure alert for a link that opened.
- New dependency `expo-web-browser` (`bunx expo install`), plugin added to `app.json`. Native
  change: the dev client was rebuilt with `runner devapp`. `expo install` reformats all of
  `app.json`; I reverted that and added only the plugin line.
- Callers unchanged: `PayDateDetail` (`handleOpenLink`, auto mark paid), `usePaycheckCardRenderer`
  (bill name on a paycheck card), Expenses tab (open icon).

## Verified (Runner 1, iOS 27, dev build, scratch Maestro flows)
- Expenses: the Internet open icon shows example.com in a page sheet; swiping it down returns to Expenses at the same place.
- Pay date: the Internet link opens the sheet; swiping it down returns to the pay date at the same scroll
  position. With Auto-mark paid on, Internet shows as paid on return.
- Light and dark: the Safari view follows the app's theme (light sheet in Light, dark in Dark).
- `bunx tsc --noEmit`, `bun run lint` pass.

## Not verified
- Android Custom Tabs (no emulator on this Mac). The link on a paycheck card in the Paychecks list
  uses the same function but was not tapped separately.
- No Maestro step: the gate cannot assert on the Safari view's contents (as the issue says).

## Pitfall
- iOS reads a bill row as one element ("Internet Open payment link for Internet …"), so Maestro
  cannot tap the icon by its label on iOS; tap a point instead.
