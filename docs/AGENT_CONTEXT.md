# Agent Context

Current state of this repo for anyone (human or agent) working in it. It is loaded into every
Claude Code session through CLAUDE.md, so it is capped at 160 lines.

This file holds only what is true today, plus open follow-ups. Do not add work entries here.
Recent work is one note per ticket in `docs/handoff/` (`ls docs/handoff | tail -5` for the newest),
so open pull requests never edit the same lines. From a branch, change this file only to fix or
delete a line that is no longer true. Lessons live in the notes and in `docs/AGENT_LESSONS.md`.
None of those are loaded; grep them. Dates are absolute (YYYY-MM-DD).

## Current state (2026-11-08)

- Version 1.1.0, never released. Build 29 is in TestFlight (2026-11-02 07:37, `main` @ `7cbd466`, gate PASS 9/9 at 07:22) and carries everything below. Build 8 (Expo 58) was the first one that launches on iOS 27.
- Expo SDK 58, React Native 0.88, React 19, TypeScript strict, bun. Expo Router with native tabs. iPhone only, portrait.
- iOS bundle id `com.johnhaup.paycheckplanner`, App Store Connect app `6825905363`, Apple team `EKHA8NK939`. Android package `com.johnhaup.paycheckplanner` (same id, so the Maestro flows need no per-platform appId); no Play listing yet. The runner's Android gate (`linear-runner/remote/jobs/android-gate.sh`, on the Linux worker) builds a Release APK and runs `.maestro/qa/` on an API 35 emulator; flows tagged `tags: [ios]` (text size, device language, the mock store: all iOS launch arguments; and `large-title`, an iOS-only behaviour) are skipped there. Since HAU-222 `eas.json` has the Android half of `production-local` (app-bundle, local credentials) and `submit.production.android` (internal track, draft), the same as Plate Weight, so `bun run ship:android` and the runner's `remote/jobs/android-release.sh` can build the AAB and upload it; the Play Console app for `com.johnhaup.paycheckplanner` does not exist yet (John creates it and uploads the first AAB by hand in the console).
- Monetisation: free app with a one-time **Pro** unlock at $4.99 (HAU-69). Product `com.johnhaup.paycheckplanner.pro` is Ready to Submit in App Store Connect with a review screenshot, so purchases work in TestFlight through the sandbox. It goes to App Review with the first version submission. Decision and evidence: `~/Projects/brain/apps/paycheck-planner/decisions.md`, `~/Projects/brain/research/pricing-model-2026-11.md`.
- Shipping is automated by `~/Projects/linear-runner`: every merge to `main` is built locally (`production-local` EAS profile, credentials in `~/Projects/_keys/apps/paycheck-planner/`), gated by the Maestro suite and uploaded to TestFlight. Git tags `v1.1.0-build.<n>` and GitHub prereleases list the Linear issues in each build.
- Maestro: `.maestro/qa/` has sixteen flows, one per feature area plus `deep-link-approval`, which `config.yaml` runs first to tap Open on iOS's one-time "Open in Paycheck Planner?" alert (the gate erases its simulator before every run; HAU-299). The mock-store purchase, relaunch, refund and restore are in `pro-mock-store.yaml` (`launchApp: arguments: { "-proStoreMock": true }`); `pro.yaml` is the free tier.
- QA simulator: `Paycheck Planner QA 27`, iPhone 17 Pro, iOS 27.0, `1D1319E5-6D19-40F1-A052-6FBE02109112`. The release gate uses its own `Paycheck Planner Release Gate` simulator. The old iOS 26.5 `Paycheck Planner QA` cannot show iOS 27 problems; do not use it.
- The main checkout (`~/Projects/paycheck-planner`) holds John's uncommitted work for HAU-25 and HAU-26. Never touch it; agents work in `~/Projects/_worktrees/paycheck-planner/<issue>`.

## Open follow-ups

- Accessibility text sizes outside Paychecks are unchecked (HAU-131 fixed Paychecks and the shared hero, date tile and section header). `PayDateSummary`'s source text and short row, and the Income and Expenses rows, likely have the same side-by-side squeeze; `useAccessibilityTextSize()` is the tool for them.
- linear-runner (not this repo): the gate's simulator build should not depend on `devicectl`. Building with `xcodebuild -configuration Release -destination id=<udid>` plus `simctl install` would avoid Expo's 5 s device listing, and so would treating three `devicectl` timeouts as exit 2 (retry next tick) instead of filing a ticket (HAU-110).
- The other flows still use `scrollUntilVisible` (large-title ×3, income ×2, text-size ×3, pro, language-direction, and the expenses form's "Add Expense" button: 11 steps) and can fail the same way as HAU-106 under load; convert them if they show up in a "Flaky gate flow" ticket. `pro.yaml`'s step is the same "Past paychecks" scroll that failed in HAU-173; `paychecks.yaml` has the replacement.
- linear-runner (not this repo): `gate.sh` files a "Release gate failed" ticket even when Maestro never opened a session (no `[Failed]` line), and two apps' gates start together on one tick. Treating "no flow ran" as exit 2 (could not run, retry next tick) and serialising gates would stop tickets like HAU-99.
- Arabic with a currency symbol that has Latin letters (US$, CA$): ordinary negative amounts from `formatMoney`/`splitMoney` probably read "$-120.00 US". macOS's `NumberFormatter` gives RLM LRM "-120.00" NBSP "US$" and CoreText draws it that way; the LRM on the minus sign makes the number a left-to-right run that takes "US" with it. Not seen in the app. The chart's amounts are fixed (HAU-154); the same RLM after the last digit would fix the rest, but `splitMoney` cuts the string at the decimal separator, so check how the two halves are drawn first.

- Restore's success path (cache says free, account owns Pro) cannot be reached in the gate: the launch check re-asks the store and grants Pro before anyone taps Restore. The gate covers Restore with nothing to restore; a positive Restore stays a manual Xcode/StoreKit check.
- HAU-25, HAU-26: John's own work in the main checkout (Paychecks scroll on focus, Today button as a native bar button item).
- Release notes for 1.1.0 (`ship/release-notes/1.1.0.json`) do not exist yet; `linear-runner/notes.sh` drafts and translates them before submission.
- Store descriptions should mention the one-time Pro purchase (App Review rule 2.3.2) before the first submission with Pro. No prices in metadata.
- Android: no Play Console app yet for `com.johnhaup.paycheckplanner` (John creates it and uploads the first AAB in the console UI; Google refuses an API upload before that), so `eas submit` fails until then even with HAU-222's profiles. No Play listing, Play product not created. Launch flags (`-proStoreMock`, text size, language) have no Android equivalent, so `pro-mock-store.yaml` and the language/text-size flows run only on iOS; an intent-extras reader would let the mock store run on Android too.
