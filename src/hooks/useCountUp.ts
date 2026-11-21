import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReduceMotion,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { FADE, TIMING } from "@/constants/motion";

const COUNT = { ...TIMING.count, reduceMotion: ReduceMotion.Never };
const RESTART = { duration: 0, reduceMotion: ReduceMotion.Never };

function sameValues(a: readonly number[], b: readonly number[]) {
  return a.length === b.length && a.every((value, i) => value === b[i]);
}

function toCents(value: number) {
  return Math.round(value * 100) / 100;
}

/**
 * Counts every number in `targets` from the values last shown to the new ones, together, so
 * several numbers in one line move as one. The timing runs on the UI thread and hands React each
 * frame's progress. The first render shows `targets` as they are. Under Reduce Motion the numbers
 * do not count: `style` fades them out and back in with the new values.
 */
export function useCountUp(targets: readonly number[]) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(targets);
  const fromRef = useRef(targets);
  const toRef = useRef(targets);
  const shownRef = useRef(targets);
  const progress = useSharedValue(1);
  const opacity = useSharedValue(1);

  const showProgress = useCallback((p: number) => {
    const from = fromRef.current;
    const next = toRef.current.map((to, i) => (p >= 1 ? to : toCents(from[i] + (to - from[i]) * p)));
    shownRef.current = next;
    setShown(next);
  }, []);

  const showTargets = useCallback(() => showProgress(1), [showProgress]);

  useAnimatedReaction(
    () => progress.get(),
    (p, previous) => {
      if (previous !== null && p !== previous) {
        scheduleOnRN(showProgress, p);
      }
    }
  );

  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  useEffect(() => {
    if (sameValues(targets, toRef.current)) {
      return;
    }
    // A count interrupted halfway starts again from where it is
    fromRef.current = shownRef.current.length === targets.length ? shownRef.current : targets;
    toRef.current = targets;
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
    progress.set(withSequence(withTiming(0, RESTART), withTiming(1, COUNT)));
  }, [targets, reduceMotion, progress, opacity, showTargets]);

  return { values: shown, style };
}
