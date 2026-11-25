import { Platform } from "react-native";
import { Easing, FadeIn, FadeOut, LinearTransition, ReduceMotion } from "react-native-reanimated";

/**
 * Every duration, spring and fade in the app. Movement (springs, slides, counts) jumps under
 * Reduce Motion (`ReduceMotion.System`); fades and colour changes still play, so Reduce Motion
 * turns movement into cross-fades. Nothing runs much past 350 ms and nothing blocks input.
 */
export const DURATION = {
  /** Press feedback */
  press: 90,
  /** Fades, colour changes, a row appearing or leaving */
  fade: 180,
  /** A pill, bar or header moving to a new place */
  move: 250,
  /** A number counting to its new value */
  count: 350,
} as const;

/**
 * Reanimated's default energy threshold keeps a settled spring creeping for a second or more,
 * which Maestro waits out; this ends it when it looks done.
 */
const ENERGY_THRESHOLD = 1e-4;

/** A spring's `duration` is perceptual: it runs about 1.5 times as long. */
export const SPRING = {
  /** Pills, thumbs and bars moving to a new place, no overshoot */
  snap: { duration: 220, dampingRatio: 1, energyThreshold: ENERGY_THRESHOLD },
  /** A small overshoot: the check mark, the + button released */
  pop: { duration: 220, dampingRatio: 0.6, energyThreshold: ENERGY_THRESHOLD },
  /** The + button bouncing in when its screen comes to the front (HAU-438) */
  bounce: { duration: 500, dampingRatio: 0.5, energyThreshold: ENERGY_THRESHOLD },
} as const;

export const TIMING = {
  move: { duration: DURATION.move, easing: Easing.out(Easing.cubic) },
  count: { duration: DURATION.count, easing: Easing.out(Easing.cubic) },
  press: { duration: DURATION.press },
} as const;

/** Colour and opacity changes: they still play under Reduce Motion */
export const FADE = { duration: DURATION.fade, reduceMotion: ReduceMotion.Never } as const;

/** How far the + button shrinks while held */
export const PRESSED_SCALE = 0.9;

/**
 * List rows: new ones fade in (iOS), removed ones fade out, the rest spring to their place.
 * Android gets no entering fade: Reanimated 4.7 leaves a cell the list mounts after its first
 * batch at FadeIn's opacity 0, so rows past the tenth were invisible (HAU-810).
 */
export const ROW_ENTERING = Platform.OS === "android" ? undefined : FadeIn.duration(DURATION.fade);
export const ROW_EXITING = FadeOut.duration(DURATION.fade);
export const LAYOUT_SPRING = LinearTransition.springify()
  .duration(SPRING.snap.duration)
  .dampingRatio(SPRING.snap.dampingRatio);
