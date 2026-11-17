import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { LayoutChangeEvent, StyleProp, ViewStyle } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";

interface Props {
  children: ReactNode;
  style: StyleProp<ViewStyle> | undefined;
  onLayout?: (event: LayoutChangeEvent) => void;
}

const REENABLE_DELAY_MS = 100;

/** `false` turns the cells' animations off; see `useListSwap`. */
export const ListCellAnimationContext = createContext(true);

/**
 * `CellRendererComponent` for a FlatList or SectionList: when rows are added, removed or
 * reordered, the rest slide to their new place, new rows fade in and removed ones fade out.
 * Wrap the list in `<LayoutAnimationConfig skipEntering>` so the first render does not fade in.
 * Reduce Motion skips all three (Reanimated's default `ReduceMotion.System`).
 */
export function AppAnimatedListCell({ children, style, onLayout }: Props) {
  const animated = useContext(ListCellAnimationContext);
  return (
    <Animated.View
      entering={animated ? FadeIn : undefined}
      exiting={animated ? FadeOut : undefined}
      layout={animated ? LinearTransition : undefined}
      style={style}
      onLayout={onLayout}
    >
      {children}
    </Animated.View>
  );
}

/**
 * For a change of view rather than of data (a filter, sort or search): `swap(change)` replaces the
 * rows at once. Fading out the leaving rows while the others slide through the same space draws
 * two rows on top of each other. Provide `animated` through `ListCellAnimationContext`.
 */
export function useListSwap() {
  const [animated, setAnimated] = useState(true);
  const [tick, setTick] = useState(0);
  const pending = useRef<(() => void)[]>([]);

  const swap = useCallback((change: () => void) => {
    pending.current.push(change);
    setAnimated(false);
    setTick((n) => n + 1);
  }, []);

  // Reanimated reads a removed view's `exiting` from its last committed props, so the cells lose
  // their animations in one commit and the rows change in the next.
  useEffect(() => {
    if (pending.current.length === 0) {
      return;
    }
    pending.current.splice(0).forEach((change) => change());
    // On again once the swapped rows are mounted, so adds and deletes animate
    const id = setTimeout(() => setAnimated(true), REENABLE_DELAY_MS);
    return () => clearTimeout(id);
  }, [tick]);

  return { animated, swap };
}
