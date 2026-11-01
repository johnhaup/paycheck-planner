# Paycheck Planner — Claude Guidelines

Budgets one paycheck at a time: income sources and bills, every upcoming paycheck shows which bills it covers and what is left. Everything is on device; no accounts, no server.

@AGENTS.md

## Commands

```bash
bun install
bunx expo start                  # dev server (Metro)
bunx expo run:ios --device <UDID> --no-bundler   # dev build on a simulator
bunx tsc --noEmit                # type check
bun run lint                     # expo lint
maestro --udid <QA sim UDID> test .maestro/qa/   # regression suite, also the release gate
bun run ship:ios                 # local EAS build + TestFlight upload (expo-local-ship); the runner does this, not you
```

No unit tests exist. Type check and lint before calling anything done.

## Layout

- `app/`: Expo Router screens only (`(tabs)` for Paychecks / Income / Expenses; modals and sheets as sibling routes, `paywall.tsx` for Pro).
- `src/`: everything else, imported through `@/` (`@/components/AppText`, never relative paths).
- `src/store.ts`: the one data store (zustand + `persist` to AsyncStorage): income sources, expenses, assignments, per-paycheck overrides. Smaller stores live in `src/stores/`.
- `src/utils/`: pure logic (pay dates, money, months, backup, CSV). Keep it free of React.
- `src/services/pro.ts`: the Pro entitlement (see below).

## UI conventions

- Text: always `AppText` with a `variant` (`hero`, `title`, `rowTitle`, `body`, `bodyStrong`, `meta`, `caption`, `section`), never RN `Text` with ad hoc styles.
- Colours: `useColors()` returns the light or dark palette from `@/constants/palette`; never hardcode hex. A fresh install is Dark.
- Spacing and radii: `MEASUREMENTS` from `@/constants/measurements`.
- Reuse the `App*` building blocks in `src/components/` (`AppButton`, `AppCard`, `AppFab`, `AppInput`, `AppSegmentedControl`, `AppSwipeActions`, …) before writing a new one.
- Haptics through `@/utils/haptics`; toasts through `sonner-native`.
- Screens with a large title must keep it collapsing: the scroll view is the screen's root, with `contentInsetAdjustmentBehavior="automatic"`. Paychecks also keeps its month overview pinned. Both regressed once on an SDK upgrade; QA checks them every run.

## Localization

- i18n-js with make-plural. `t(key)` from `@/localization/i18n`; keys are typed against `en.json`.
- 45 in-app locales in `src/localization/locales/`, RTL for ar, he, ur. Every new string goes into every locale file in the same change.
- Store listing text (49 locales) lives in `ship/listing/`; release notes per version in `ship/release-notes/<version>.json`.

## Pro (one-time unlock, no subscriptions)

- Product `com.johnhaup.paycheckplanner.pro`, $4.99, non-consumable, Family Sharing on. Through `expo-iap` only: no RevenueCat, no analytics, no server.
- `useIsPro()` and the cached entitlement in `src/services/pro.ts`; the store is re-asked on every launch so refunds revoke.
- Gate a control with `useProGate()` (`src/hooks/useProGate.ts`) and show `ProBadge`. Free users see the badge and get the paywall on tap. Nothing a user already has is ever hidden.
- Free: one income source, unlimited bills, this month and next, mark paid, payment links, backup. Pro: more income sources, 12-month view, reminders, set-asides and goals, per-paycheck overrides, history, CSV export. Linear issues labelled `Paid` are Pro features.
- Copy says "one-time purchase", never "lifetime".

## Shipping and QA

Shipping is automated by `~/Projects/linear-runner` (Linear → engineer → QA → merge → release gate → TestFlight). The release gate runs every flow in `.maestro/qa/` on a plain Release build launched with `simctl`, so a flow there must pass with no Metro, no Xcode and no StoreKit test environment. Purchase steps that need the StoreKit configuration live in `.maestro/pro/`. Never open the Xcode app; build with `xcodebuild` or `expo run:ios`.

Shared agent context (principles, decisions, features, QA notes) is in `~/Projects/brain/apps/paycheck-planner/`.

## Agent context document

@docs/AGENT_CONTEXT.md

`docs/AGENT_CONTEXT.md` is the running handoff for this repo. Read it before starting work (it is imported above). Before ending any turn that changed code, update it: current state, a dated entry under Recent work, any lesson or pitfall worth not repeating, and Open follow-ups. A Stop hook (`.claude/hooks/check-agent-context.sh`) blocks the turn until the file is touched. Keep it under ~150 lines: move old Recent work entries verbatim to `docs/AGENT_CONTEXT_ARCHIVE.md` (not loaded, grep on demand) and never prune lessons for length. Commit it together with the code it describes.
