import { useMemo } from "react";
import { I18nManager } from "react-native";
import { useSafeAreaFrame, useSafeAreaInsets } from "react-native-safe-area-context";
import { MEASUREMENTS } from "@/constants/measurements";

/** Content and its gutters never grow wider than this; what is left over is split between the two sides */
const COLUMN_MAX_WIDTH = 600;

/**
 * Side padding for a screen's content: the safe area (iPhone Duo keeps a status column beside the
 * app), then the centring margin on a wide screen (iPhone Duo unfolded), then `inner`.
 * On other iPhones this is `inner` on both sides.
 */
export function useGutters(inner: number = MEASUREMENTS.spacing.gutter) {
  const { width } = useSafeAreaFrame();
  const { left, right } = useSafeAreaInsets();

  return useMemo(() => {
    const margin = Math.max(0, (width - left - right - COLUMN_MAX_WIDTH) / 2);
    // React Native swaps left and right styles in RTL; the safe area is physical
    const [start, end] = I18nManager.isRTL ? [right, left] : [left, right];
    return { paddingLeft: start + margin + inner, paddingRight: end + margin + inner };
  }, [width, left, right, inner]);
}
