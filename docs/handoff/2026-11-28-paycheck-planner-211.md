# paycheck-planner-211: the Paychecks shortfall line fades and the chart glides (2026-11-28)

## What changed and why
- New `src/components/paychecks/ShortfallLine.tsx`: the red "… is short by … >" line under the hero.
  It used to mount and unmount, so the header grew or shrank by one line in a frame and the chart
  and every card jumped. Now it fades (`FADE`) and its clip's height springs (`SPRING.snap`) between
  0 and the text's height, so Yoga moves the chart and the list with it frame by frame. The text
  stays while it fades out and unmounts when the spring ends.
- Under Reduce Motion, or with the header collapsed (`collapse !== 0`), the height changes at once:
  before the fade-in, after the fade-out. Collapsed pills behave as on `main` (checked side by side).
- The header's height floor (HAU-440, HAU-625) moved from the whole sticky header to the summary
  above the line (`handleSummaryLayout`). The line has its own floor, keyed on `months`. A floor
  over the whole header caught a mid-animation height and stopped the closing line from shrinking.

## Pitfalls (each one cost a round)
- A child of a clip with `height`/`maxHeight` 0 is laid out at 0 too (onLayout said 0, `measure`
  said 0), so the open spring had no height to scale and snapped open at the end. While it animates,
  the text is `position: absolute` (top/start/end 0) and is measured on the UI thread each frame;
  settled open, it is back in the flow and the clip is `height: "auto"`.
- `withDelay` drops its delay under Reduce Motion unless given `ReduceMotion.Never`; without it
  the height vanished before the fade-out could be seen.
- `simctl io recordVideo` writes frames only when the screen changes; read `pts_time` gaps before
  you conclude a jump. Measuring a pixel column per frame (ffmpeg rawvideo crop) told the truth.
- In zsh, `$M` holding a whole command does not word-split; script repeated Maestro calls in bash.

## Verified (Runner 1, iOS 27, dev build on Metro, sample data, Pro on the mock store)
- Save 3 on the Nov 30 amount: the chart's top edge went 940→944→974→1005→1019→1024→1026 px over
  ~400 ms, the line fading in while the hero counted. "Use usual amount": 1026→1000→965→950→…→940
  over ~450 ms, the line fading out. Before the fix it was 940→1026 in one frame.
- Reduce Motion on: Save, the line's red fades 34→200 over ~150 ms after one height step; leave,
  the red fades to 0 in ~120 ms, then the chart steps up in one frame.
- Collapsed to the pills, Save: the pills move as on `main` (same 437→452 px measured on both).
- `.maestro/qa/paychecks.yaml` and `pro.yaml` pass. Light mode and the empty state by screenshot;
  tapping the line still jumps. `bunx tsc --noEmit`, `bun run lint` clean.

## Not verified
- Android (Mac job) and iPhone Duo. The fade has no Android-only path; the absolute/relative swap
  and `height: "auto"` from an animated style are plain Reanimated layout props.
