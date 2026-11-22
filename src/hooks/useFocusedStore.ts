import { useRef } from "react";
import { useIsFocused } from "expo-router";
import { useStore } from "@/store";

type AppState = ReturnType<typeof useStore.getState>;

/**
 * `useStore(selector)` that holds the value it had when the screen was last focused. A screen behind
 * another one (Paychecks behind the pay date screen) then does not re-render its whole list for every
 * change made on top, which kept the JS thread busy while the screen in front counted its money
 * (HAU-699). Coming back to the screen catches up at once, and its amounts count to the new values.
 */
export function useFocusedStore<T>(selector: (state: AppState) => T): T {
  const isFocused = useIsFocused();
  const held = useRef<{ value: T } | null>(null);
  return useStore((state) => {
    if (isFocused || !held.current) {
      held.current = { value: selector(state) };
    }
    return held.current.value;
  });
}
