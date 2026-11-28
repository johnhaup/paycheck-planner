import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigation } from "expo-router";
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { DURATION, FADE, TIMING } from "@/constants/motion";

/** Moves a count by one frame's time; returns true when it is done */
type Tick = (stepMs: number) => boolean;

const FRAME_MS = 1000 / 60;
/** A late frame moves the count by at most two 60 Hz frames, so a busy JS thread slows it instead of skipping it */
const MAX_STEP_MS = 1000 / 30;

const ticks = new Set<Tick>();
let running = false;
let lastFrame = 0;
/** Waiting for the frame loop to finish (afterCounts) */
const idleCallbacks = new Set<() => void>();

function frame(now: number) {
  const step = lastFrame === 0 ? FRAME_MS : Math.min(now - lastFrame, MAX_STEP_MS);
  lastFrame = now;
  for (const tick of ticks) {
    if (tick(step)) {
      ticks.delete(tick);
    }
  }
  if (ticks.size > 0) {
    requestAnimationFrame(frame);
  } else {
    running = false;
    for (const callback of idleCallbacks) {
      callback();
    }
    idleCallbacks.clear();
  }
}

/** Runs `tick` on every frame from the next one until it returns true; the returned function stops it */
function startTick(tick: Tick) {
  ticks.add(tick);
  if (!running) {
    running = true;
    lastFrame = 0;
    requestAnimationFrame(frame);
  }
  return () => {
    ticks.delete(tick);
  };
}

/**
 * Runs `callback` once no count is running. It looks on the next frame, so a count started by the
 * commit under way (a delete's total counting down) is waited for. The returned function cancels it.
 */
export function afterCounts(callback: () => void) {
  const frameId = requestAnimationFrame(() => {
    if (running) {
      idleCallbacks.add(callback);
    } else {
      callback();
    }
  });
  return () => {
    cancelAnimationFrame(frameId);
    idleCallbacks.delete(callback);
  };
}

function sameValues(a: readonly number[], b: readonly number[]) {
  return a.length === b.length && a.every((value, i) => value === b[i]);
}

function toCents(value: number) {
  return Math.round(value * 100) / 100;
}

/**
 * Counts every number in `targets` from the values last shown to the new ones, together, so
 * several numbers in one line move as one. Counts run on the JS thread from the frame after the
 * commit, one shared frame loop for every count, so all of them update in one render per frame;
 * steps are capped so a busy frame delays the count instead of skipping most of it. The first
 * render shows `targets` as they are, and a screen that is not focused snaps to them. Under
 * Reduce Motion the numbers do not count: `style` fades them out and back in with the new values.
 */
export function useCountUp(targets: readonly number[]) {
  const reduceMotion = useReducedMotion();
  // Read when a value changes, not subscribed: useIsFocused re-rendered every count on the screen
  // on each focus change, which held a sheet's dismiss over the 12-month Paychecks list (#203)
  const navigation = useNavigation();
  const [shown, setShown] = useState(targets);
  const toRef = useRef(targets);
  const shownRef = useRef(targets);
  const stopRef = useRef<(() => void) | null>(null);
  const opacity = useSharedValue(1);

  const showTargets = useCallback(() => {
    shownRef.current = toRef.current;
    setShown(toRef.current);
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  useEffect(() => {
    if (sameValues(targets, toRef.current)) {
      return;
    }
    stopRef.current?.();
    stopRef.current = null;
    // A count interrupted halfway starts again from where it is
    const from = shownRef.current.length === targets.length ? shownRef.current : targets;
    toRef.current = targets;
    if (!navigation.isFocused()) {
      showTargets();
      return;
    }
    if (reduceMotion) {
      opacity.set(
        withSequence(
          withTiming(0, FADE, (finished) => {
            if (finished) {
              scheduleOnRN(showTargets);
            }
          }),
          withTiming(1, FADE)
        )
      );
      return;
    }
    let elapsed = 0;
    stopRef.current = startTick((step) => {
      elapsed += step;
      const done = elapsed >= DURATION.count;
      const p = TIMING.count.easing(Math.min(elapsed / DURATION.count, 1));
      const next = done ? targets : targets.map((to, i) => toCents(from[i] + (to - from[i]) * p));
      shownRef.current = next;
      setShown(next);
      return done;
    });
  }, [targets, reduceMotion, navigation, opacity, showTargets]);

  useEffect(() => () => stopRef.current?.(), []);

  return { values: shown, style };
}
