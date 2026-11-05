import { createContext, use, useMemo, type ReactNode } from "react";
import { StyleSheet, type LayoutChangeEvent } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";

/** How far down the list's content the pinned header has been pushed, in points. */
export const PinnedHeaderShift = createContext<SharedValue<number> | undefined>(undefined);

type Props = {
  children?: ReactNode;
  onLayout: (event: LayoutChangeEvent) => void;
};

/**
 * A list's `StickyHeaderComponent` that pins the header wherever `PinnedHeaderShift`
 * puts it. React Native's own wrapper can only pin a header's top edge to the
 * list's top edge; shifting the content inside it leaves the wrapper's empty
 * box over the rows below, where it takes their touches. Here the wrapper
 * itself moves, so the box that takes touches is the header on screen.
 */
export function PinnedHeader({ children, onLayout }: Props) {
  const shift = use(PinnedHeaderShift);
  const pinStyle = useAnimatedStyle(() => ({ transform: [{ translateY: shift?.value ?? 0 }] }));
  const style = useMemo(() => [styles.header, pinStyle], [pinStyle]);

  return (
    <Animated.View style={style} onLayout={onLayout}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    // Above the rows that scroll under it
    zIndex: 1,
  },
});
