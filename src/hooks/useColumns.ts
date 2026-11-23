import { useMemo } from "react";
import { useSafeAreaFrame } from "react-native-safe-area-context";
import { COLUMN_GAP, isRegularWidth } from "@/constants/layout";
import { MEASUREMENTS } from "@/constants/measurements";
import { useGutters } from "@/hooks/useGutters";

/**
 * The two columns of a regular-width screen (iPhone Duo or Pixel 9 Pro Fold unfolded), undefined on a
 * compact one. They split at the window's middle, not the safe area's: that is where the device folds. The status
 * column on one side makes that column narrower.
 */
export function useColumns(inner: number = MEASUREMENTS.spacing.gutter) {
  const { width } = useSafeAreaFrame();
  const { paddingLeft, paddingRight } = useGutters(inner);

  return useMemo(() => {
    if (!isRegularWidth(width)) return undefined;
    const half = (width - COLUMN_GAP) / 2;
    return {
      startWidth: half - paddingLeft,
      endWidth: half - paddingRight,
      /** Padding that keeps content in one column: from the far window edge to this column's inner edge */
      pastMiddle: width - half,
    };
  }, [width, paddingLeft, paddingRight]);
}
