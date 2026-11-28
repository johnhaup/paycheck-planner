# #212: deleting a card's last row no longer draws the hint or next header over it

## What changed and why
- A removed list row fades out where it was, as a ghost beneath the cells after it. A middle row's
  neighbours hide it as they spring up (their card background is opaque). A section header (Expenses)
  or the swipe hint (Income) is transparent, so its text was printed over the fading row.
- `AppAnimatedListCell` now paints `colors.screenBackground` on every cell, so whatever slides into
  a leaving row's place covers it, like a card row does. Every list that uses it (Income, Expenses,
  PayDateDetail) already sits on `screenBackground`, so nothing looks different at rest.
- Income: the swipe hint was the FlatList's `ListFooterComponent`. VirtualizedList wraps the footer
  in a plain View (not `CellRendererComponent`), so it had no layout spring and jumped in one frame.
  The hint is now the list's last data item (`HINT` sentinel, only when there are sources, so the
  empty state still shows), and it carries the list's bottom padding. Its opaque cell then
  covers the whole leaving row, not just one band of it.

## Verified (Runner 1, iOS 27, dev build, sample data)
- Frames from `simctl io recordVideo` + ffmpeg, before and after. Before: the hint is drawn over
  "Mesa Health" in one frame. After: the hint slides up over about 8 frames, and its cell covers
  the row from below. The hint text is never drawn over row text.
- Income Undo: the hint slides down over about 8 frames while Mesa Health fades in.
- Expenses (Grouped): deleting Savings (last of Brightline Co.): the "MESA HEALTH" header's cell
  covers the fading row as it rises, and its text never overlaps. Deleting Internet (a middle row) looks as before.
- Light mode is the same; the cells do not show against the background. The empty Income state
  shows no hint.
- `income.yaml`, `expenses.yaml` and `paychecks.yaml` pass; tsc and lint are clean.

## Pitfalls
- A FlatList footer or header never animates with `layout`: put content that must move with
  the rows into `data`.
- Maestro `tapOn: "Delete"` after a swipe sometimes closes the row and taps the row under it
  (opens the edit form). Tap the trash by point instead.
- Not checked on Android: the cell background is the same colour there, so it should look the same.

## Follow-up (not done)
- When the last row is deleted, the row above it rounds its bottom corners at once while the
  ghost is still fading below it. This was already so before #212 and is not in the issue.
