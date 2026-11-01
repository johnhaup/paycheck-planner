# Agent Context

Running handoff document for anyone (human or agent) working in this repo. It is loaded into every Claude Code session through CLAUDE.md and enforced by a Stop hook: a turn that changes code cannot end until this file is touched too.

Keep it under ~150 lines. When "Recent work" grows past the last few batches, move the oldest entries verbatim to `docs/AGENT_CONTEXT_ARCHIVE.md` (newest first; never loaded, only grepped). Lessons and open follow-ups are never pruned for length, only when they stop being true. Dates are absolute (YYYY-MM-DD).

## Current state (2026-11-01)

- Version 1.1.0, never released. Build 11 is in TestFlight (2026-11-01, `main` @ `321cafe`) and carries everything below. Build 8 (Expo 58) was the first one that launches on iOS 27.
- Expo SDK 58, React Native 0.88, React 19, TypeScript strict, bun. Expo Router with native tabs. iPhone only, portrait.
- iOS bundle id `com.johnhaup.paycheckplanner`, App Store Connect app `6825905363`, Apple team `EKHA8NK939`. No Android package; Android has never been built.
- Monetisation: free app with a one-time **Pro** unlock at $4.99 (HAU-69). Product `com.johnhaup.paycheckplanner.pro` is Ready to Submit in App Store Connect with a review screenshot, so purchases work in TestFlight through the sandbox. It goes to App Review with the first version submission. Decision and evidence: `~/Projects/brain/apps/paycheck-planner/decisions.md`, `~/Projects/brain/research/pricing-model-2026-11.md`.
- Shipping is automated by `~/Projects/linear-runner`: every merge to `main` is built locally (`production-local` EAS profile, credentials in `~/Projects/_keys/apps/paycheck-planner/`), gated by the Maestro suite and uploaded to TestFlight. Git tags `v1.1.0-build.<n>` and GitHub prereleases list the Linear issues in each build.
- Maestro: `.maestro/qa/` has nine flows (smoke, paychecks, pay-date-detail, income, expenses, settings, large-title, accessibility, pro). `.maestro/pro/purchase.yaml` holds the buy, relaunch and restore steps, which need the StoreKit test environment and are not run by the gate.
- QA simulator: `Paycheck Planner QA 27`, iPhone 17 Pro, iOS 27.0, `1D1319E5-6D19-40F1-A052-6FBE02109112`. The release gate uses its own `Paycheck Planner Release Gate` simulator. The old iOS 26.5 `Paycheck Planner QA` cannot show iOS 27 problems; do not use it.
- The main checkout (`~/Projects/paycheck-planner`) holds John's uncommitted work for HAU-25 and HAU-26. Never touch it; agents work in `~/Projects/_worktrees/paycheck-planner/<issue>`.

## Recent work

- 2026-11-01 (handoff docs): added this file, `CLAUDE.md` and the Stop hook, seeded from the brain and the Linear history of the last week.
- 2026-11-01 (HAU-69, PR #20): Pro unlock through `expo-iap`. `src/services/pro.ts` caches the entitlement and re-checks it every launch; `useProGate` + `ProBadge` gate controls; `app/paywall.tsx` shows the live store price, Buy and Restore Purchases. `PaycheckPlanner.storekit` plus `plugins/withStoreKitConfiguration.js` wire a StoreKit configuration into the Xcode scheme for local testing. QA verified the free tier, badges and paywall; Buy, persistence and Restore were not verifiable outside Xcode (see lessons).
- 2026-11-01 (PRs #21, #22): `pro.yaml` made gate-safe (free tier and paywall only); purchase steps moved to `.maestro/pro/purchase.yaml`.
- 2026-11-01 (HAU-60, PR #18): the Reanimated "dependencies" warning from sonner-native's toast hooks raised a LogBox banner over the tab bar in dev builds and hid taps from Maestro. The exact message is ignored in `app/_layout.tsx`.
- 2026-11-01 (HAU-61, PR #19): VoiceOver labels on the Settings gear and close buttons; `accessibility.yaml` guards them.
- 2026-11-01 (HAU-58, PR #16): the large title collapses again and the month overview stays pinned on Paychecks. The Expo 58 upgrade had broken both because the FlatList sat inside a root View.
- 2026-10-31 (HAU-52, PR #14): Expo SDK 57 → 58. Xcode 27.1 builds of the SDK 57 app crashed at launch on iOS 27 (no UIScene lifecycle); SDK 58's prebuild adds `SceneDelegate` and the scene manifest.
- 2026-10-31 (PR #13): local TestFlight shipping (`production-local` profile, `ship:ios`, credentials gitignored). HAU-15/16/17/46: keyboard coverage in forms, wider month range, Today button moved to a calendar icon beside the month label.

## Lessons and pitfalls (do not repeat)

- An Expo SDK upgrade can silently break native-feeling behaviour that no type check sees. HAU-52 passed QA with the collapsing large title and pinned overview both broken; John found it in TestFlight. Those two are now a must-check on every QA run and a flow (`large-title.yaml`).
- Large titles only collapse when the scrolling view is the screen's root and uses `contentInsetAdjustmentBehavior="automatic"`. A FlatList wrapped in a View loses it.
- StoreKit testing: the `.storekit` configuration reaches the simulator only through Xcode's run action. From a `simctl` launch, Buy goes to the real App Store sandbox and raises a "Sign in to Apple Account" alert that Maestro cannot see and that survives `clearState` relaunches, so every later flow fails at Welcome. That is why purchase steps are not in `.maestro/qa/`. HAU-78 adds a mock store behind a launch argument so the gate can buy and restore.
- The App Store Connect product stays "Missing Metadata", and purchases fail in TestFlight, until a review screenshot of the paywall is attached.
- `expo run:ios --device <udid>` ends with an `osascript` call that hangs while a macOS Automation prompt waits on John's desktop. For a Release build to install by hand, build with `--device generic --output <dir>` and `simctl install` instead.
- Dev builds load JS from Metro on 8081 only after `clearState` (it wipes `RCT_jsLocation`). Start Metro on 8081 before running the suite against a Debug build; a Release build needs no Metro (it has `main.jsbundle` in the app container).
- Maestro: Settings rows with a chevron have labels ending in ", " so match with `".*Erase all data.*"`. The month chart columns match only by their accessibility label (`"September 2027, $5k left"`). Sample data comes from "Try with sample data" on the empty Paychecks tab. Past paychecks' title is "Past paychecks", not "History".
- A fresh install is Dark whatever the OS appearance says (`themeStore` default).
- Never open the Xcode app from an agent shell. A GUI Xcode holding a worktree's workspace leaves dialogs on John's screen when prebuild regenerates `ios/`.
- Flows in `.maestro/qa/` run on a loaded Mac in the release gate: use `extendedWaitUntil` on the element the next step needs with 10-20 s timeouts, never fixed sleeps. A flow that only passes on an idle machine is a flake.

## Open follow-ups

- HAU-78: mock store behind a launch argument; then fold `.maestro/pro/purchase.yaml` back into `.maestro/qa/pro.yaml` and delete it.
- HAU-25, HAU-26: John's own work in the main checkout (Paychecks scroll on focus, Today button as a native bar button item).
- Release notes for 1.1.0 (`ship/release-notes/1.1.0.json`) do not exist yet; `linear-runner/notes.sh` drafts and translates them before submission.
- Store descriptions should mention the one-time Pro purchase (App Review rule 2.3.2) before the first submission with Pro. No prices in metadata.
- Android: no `android.package`, no Play listing, Play product not created.
