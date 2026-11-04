import { useWindowDimensions } from "react-native";

/** Between iOS's largest standard text size (1.353) and its smallest accessibility size (1.786) */
const ACCESSIBILITY_FONT_SCALE = 1.5;

/** True at the accessibility text sizes, where a label and an amount no longer fit side by side and rows stack. */
export function useAccessibilityTextSize() {
  return useWindowDimensions().fontScale >= ACCESSIBILITY_FONT_SCALE;
}
