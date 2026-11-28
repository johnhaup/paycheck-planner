import { useEffect, useState } from "react";
import { useIsFocused } from "expo-router";
import { afterCounts } from "@/hooks/useCountUp";

/**
 * `value` as it is while the screen is focused. While it is not (Paychecks on a hidden tab), a new
 * value arrives only once the counts it set off have finished: a twelve-month list mounting or
 * unmounting its cards holds the JS thread for a moment, and every count in the app runs there (#203).
 * The screen catches up at once when it is focused again.
 */
export function useValueAfterCounts<T>(value: T): T {
  const isFocused = useIsFocused();
  const [settled, setSettled] = useState(value);
  if (isFocused && settled !== value) {
    setSettled(value);
  }

  useEffect(() => {
    if (isFocused) {
      return;
    }
    return afterCounts(() => setSettled(value));
  }, [isFocused, value]);

  return isFocused ? value : settled;
}
