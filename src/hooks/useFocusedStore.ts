import { useRef } from "react";
import { useIsFocused, useNavigation } from "expo-router";
import { useStore } from "@/store";

type AppState = ReturnType<typeof useStore.getState>;

/** The part of a navigation object this hook reads */
type Navigation = {
  getParent(): Navigation | undefined;
  getState(): { key: string; type: string; index: number; routes: { state?: { key?: string } }[] };
};

/** True when the screen sits on a tab that is not the selected one */
function isOnHiddenTab(navigation: Navigation | undefined): boolean {
  let nav = navigation;
  while (nav) {
    const parent = nav.getParent();
    const parentState = parent?.getState();
    if (parentState?.type === "tab") {
      return parentState.routes[parentState.index]?.state?.key !== nav.getState().key;
    }
    nav = parent;
  }
  return false;
}

/**
 * `useStore(selector)` that holds the value it had when the screen was last focused, while another
 * screen is pushed over it (Paychecks behind the pay date screen). It then does not re-render its
 * whole list for every change made on top, which kept the JS thread busy while the screen in front
 * counted its money (HAU-699). Coming back to the screen catches up at once, and its amounts count
 * to the new values. A screen on a hidden tab is not held: it renders changes made on other tabs
 * before it is shown again, so a tab return shows current data at once (HAU-903).
 */
export function useFocusedStore<T>(selector: (state: AppState) => T): T {
  const isFocused = useIsFocused();
  const navigation = useNavigation<Navigation>();
  const held = useRef<{ value: T } | null>(null);
  return useStore((state) => {
    // Read here, on a store change, not at render: on a tab switch the blur re-renders the screen
    // while the tab navigator's state still names the old tab
    const hold = !isFocused && !isOnHiddenTab(navigation);
    if (!hold || !held.current) {
      held.current = { value: selector(state) };
    }
    return held.current.value;
  });
}
