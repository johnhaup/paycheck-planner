# iPhone Duo App Store screenshots

App Store Connect has one screenshot display type for the Duo, `APP_IPHONE_DUO`
(`IMESSAGE_APP_IPHONE_DUO` is for iMessage apps only). Checked on 2026-11-17: the API lists it
among the display types it accepts for this app.

| Screen           | Portrait px | Landscape px | Files                                  |
| ---------------- | ----------- | ------------ | -------------------------------------- |
| Folded (cover)   | 1398 × 2034 | 2034 × 1398  | `folded/raw`, `folded/framed`          |
| Unfolded (inner) | 2007 × 2853 | 2853 × 2007  | `unfolded/raw`, `unfolded/framed`, `unfolded/landscape` |

- `framed/en-US/01…05`: the store images, portrait, the five scenes and captions of the iPhone set
  (no poster: the framer lays it out for a tall phone). Other locales are framed on demand, like
  the iPhone set, and are gitignored.
- `raw/`: the portrait captures the framed images are made from.
- `unfolded/landscape/`: the inner screen on its side, unframed (the framer is portrait only). The
  app is portrait-only, so the cover screen has no landscape layout and no 2034 × 1398 image.

Nothing here is uploaded yet. Version 1.1.0 was waiting for review when these were made, which
locks its screenshots; upload to the next version's `APP_IPHONE_DUO` set once one can be edited.

## Making them again

1. Install a Release build made with `EXPO_PUBLIC_STORE_DEMO=1` on the `Paycheck Planner Duo`
   simulator (iPhone Duo, iOS 27.1).
2. Have [duoctl](https://github.com/skarol/duoctl) v0.2.1 (commit c6ff3e9) on `PATH` or its path in
   `DUOCTL`, plus `axe` and `rsvg-convert`. duoctl uses private simulator interfaces: check it
   again after an Xcode update.
3. `bun store:screenshots:duo` (or `… capture`, `… frame`, `… frame --locales=de-DE,ja`). Read
   every image afterwards.
