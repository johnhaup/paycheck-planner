import { type RefObject, useCallback, useEffect, useRef } from "react";
import { type NativeScrollEvent, type NativeSyntheticEvent, Platform, useWindowDimensions } from "react-native";

/** A ScrollView (or KeyboardAwareScrollView), a FlatList, or a SectionList */
type Scrollable =
  | { scrollTo(options: { y: number; animated: boolean }): void }
  | { scrollToOffset(options: { offset: number; animated: boolean }): void }
  | { getScrollResponder(): { scrollTo(options: { y: number; animated: boolean }): void } | null | undefined };

function scrollBack(target: Scrollable, y: number) {
  if ("scrollToOffset" in target) target.scrollToOffset({ offset: y, animated: false });
  else if ("scrollTo" in target) target.scrollTo({ y, animated: false });
  else target.getScrollResponder()?.scrollTo({ y, animated: false });
}

/**
 * Folding or unfolding an Android foldable resizes the window, and a scroll view comes back at its top.
 * Keeps where the user last left it (a drag or a fling ending) and scrolls back there after the window
 * changes size; the scroll view clamps it when the content got shorter (HAU-669, as Plate Weight's
 * HAU-668). iOS keeps its offset itself, so this does nothing there. Spread the result onto the scroll view.
 */
export function useScrollKeptOnResize(ref: RefObject<Scrollable | null>) {
  const { width, height } = useWindowDimensions();
  const rest = useRef(0);

  const onRest = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    rest.current = e.nativeEvent.contentOffset.y;
  }, []);

  useEffect(() => {
    const y = rest.current;
    if (Platform.OS !== "android" || y <= 0) return;
    const frame = requestAnimationFrame(() => {
      if (ref.current) scrollBack(ref.current, y);
    });
    return () => cancelAnimationFrame(frame);
  }, [ref, width, height]);

  return { onScrollEndDrag: onRest, onMomentumScrollEnd: onRest };
}
