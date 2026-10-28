import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "react-native-reanimated";

const DURATION_MS = 450;

/** Eases from the value last shown to `target`. The first render shows `target` as is. */
export function useAnimatedNumber(target: number): number {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(target);
  // Where an interrupted animation left off, so the next one starts there
  const shownRef = useRef(target);

  useEffect(() => {
    const from = shownRef.current;
    if (from === target || reduceMotion) {
      shownRef.current = target;
      setValue(target);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = () => {
      const progress = Math.min((performance.now() - start) / DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = progress === 1 ? target : Math.round((from + (target - from) * eased) * 100) / 100;
      shownRef.current = next;
      setValue(next);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, reduceMotion]);

  return value;
}
