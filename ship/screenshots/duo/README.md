# iPhone Duo App Store screenshots

App Store Connect has one screenshot display type for the Duo, `APP_IPHONE_DUO`
(`IMESSAGE_APP_IPHONE_DUO` is for iMessage apps only). Checked on 2026-11-17: the API lists it
among the display types it accepts for this app.

| Screen           | Portrait px | Landscape px | Files                                  |
| ---------------- | ----------- | ------------ | -------------------------------------- |
| Folded (cover)   | 1398 × 2034 | 2034 × 1398  | `folded/raw`, `folded/framed`          |
| Unfolded (inner) | 2007 × 2853 | 2853 × 2007  | `unfolded/raw`, `unfolded/framed`, `unfolded/landscape` |

- `framed/en-US/01…07`: the store images, portrait, the seven scenes and captions of the iPhone set
  (no poster: the framer lays it out for a tall phone). Other locales are framed on demand, like
  the iPhone set, and are gitignored.
- `raw/`: the portrait captures the framed images are made from. The cover set is
  `ship/screenshots.yaml` itself, run by Maestro on the folded Duo. The inner set is the same scenes
  driven by duoctl, where a paycheck opens beside the list instead of on its own screen.
- `unfolded/landscape/`: the inner screen on its side, unframed (the framer is portrait only). The
  app is portrait-only, so the cover screen has no landscape layout and no 2034 × 1398 image.

Nothing here is uploaded yet: expo-local-ship's uploader does not know the `APP_IPHONE_DUO` set.

## Making them again

1. Have a build with `EXPO_PUBLIC_STORE_DEMO=1` on an iPhone Duo simulator (iOS 27.1), named
   `Paycheck Planner Duo` or whatever `DUO_SIMULATOR` says: a Release build, or the dev build with
   `METRO_URL` set to a Metro started with that flag (`EXPO_PUBLIC_STORE_DEMO=1 bunx expo start
   --dev-client --port 8096`, then `METRO_URL=http://127.0.0.1:8096`).
2. Have [duoctl](https://github.com/skarol/duoctl) v0.2.1 (commit c6ff3e9) on `PATH` or its path in
   `DUOCTL`, plus `maestro`, `axe` and `rsvg-convert`. duoctl uses private simulator interfaces:
   check it again after an Xcode update.
3. `bun store:screenshots:duo` (or `… capture`, `… frame`, `… frame --locales=de-DE,ja`). Read
   every image afterwards.
