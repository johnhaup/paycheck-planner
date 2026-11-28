# paycheck-planner-206: Android, paid bills on Paychecks not struck through

## What changed and why
- `AppText` (Android only): a style with `textDecorationLine: "line-through"` renders `StruckText`, the text
  without its decoration plus a `View` line across the middle of the laid-out line (x and width from
  `onTextLayout`), in the text's colour, about Roboto's thickness (fontSize / 18). iOS is untouched.
- Cause: RN 0.88's `ReactTextView` paints a strike-through itself (`ReactStrikethroughSpan`, a
  `CanvasEffectSpan`) in `onDraw`, only when `getLayout()` is not null. One draw after a mount or update
  can go out without it, and nothing redraws: the colour changes, the line doesn't. A forced redraw
  (Developer options → layout bounds, `setprop debug.layout true` + `service call activity 1599295570`)
  made the missing lines appear, which is what proved it. RN is prebuilt on Android, so a native patch
  is not an option. Remounting the text on paid changes (a `key`) was tried and isn't enough: cold
  launches still missed lines, rows with a payment link most often.
- `AppSectionHeader`: the title has `key={title}`. After switching to Arabic (a JS reload in the same
  process, since the direction flips), Android kept the December header's old line breaks and drew only
  "رواتب". A new text view per title draws the whole text.

## Verified (Release APK, `runner` AVD, API 35, sample data, free tier)
- English 1.0: 3 cold launches, every paid row struck (Groceries, Car Payment, Car Registration,
  Internet; the last two have links). Mark/unmark from the check circle strikes/unstrikes at once.
- English 1.3: 3 cold launches, all struck. Arabic 1.0 and 1.3: 3 cold launches each, all struck, line
  where the text is in RTL. Pay date screen (Arabic): all paid bills struck.
- Arabic switch in session, then scroll: "رواتب ديسمبر" now draws both words.
- `bunx tsc --noEmit`, `bun run lint` pass. No unit tests in the repo.

## Follow-ups / pitfalls
- Right after the switch to Arabic, the December header wraps onto two lines (Fabric measures it
  narrower than on a cold launch; a cold launch shows one line). Native measure state that survives
  `reloadAppAsync`; not reachable from JS.
- At stacked sizes (font scale ≥ 1.5) Android's `adjustsFontSizeToFit` shrinks each word again at draw
  time (`ReactTextView.onDraw` → `adjustSpannableFontToFit`), so words draw ~10% narrower than their
  frame and `onTextLayout` width, and the line runs a little past each word. Same quirk shrinks unpaid
  words too.
- iOS not checked (Linux machine); the iOS branch of `AppText` is unchanged, and the header key only
  remounts on a language change.
