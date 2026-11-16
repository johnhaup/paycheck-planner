import type { ReactNode } from "react";
import type { LayoutChangeEvent, StyleProp, ViewStyle } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";

interface Props {
  children: ReactNode;
  style: StyleProp<ViewStyle> | undefined;
  onLayout?: (event: LayoutChangeEvent) => void;
}

/**
 * `CellRendererComponent` for a FlatList or SectionList: when rows are added, removed or
 * reordered, the rest slide to their new place, new rows fade in and removed ones fade out.
 * Wrap the list in `<LayoutAnimationConfig skipEntering>` so the first render does not fade in.
 * Reduce Motion skips all three (Reanimated's default `ReduceMotion.System`).
 */
export function AppAnimatedListCell({ children, style, onLayout }: Props) {
  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      layout={LinearTransition}
      style={style}
      onLayout={onLayout}
    >
      {children}
    </Animated.View>
  );
}
