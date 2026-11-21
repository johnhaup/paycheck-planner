import { useMemo } from "react";
import { I18nManager } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MEASUREMENTS } from "@/constants/measurements";

/**
 * Side padding for a screen's content: the safe area (iPhone Duo keeps a status column beside the
 * app, folded and unfolded on its side), then `inner`. On other iPhones this is `inner` on both sides.
 */
export function useGutters(inner: number = MEASUREMENTS.spacing.gutter) {
  const { left, right } = useSafeAreaInsets();

  return useMemo(() => {
    // React Native swaps left and right styles in RTL; the safe area is physical
    const [start, end] = I18nManager.isRTL ? [right, left] : [left, right];
    return { paddingLeft: start + inner, paddingRight: end + inner };
  }, [left, right, inner]);
}
