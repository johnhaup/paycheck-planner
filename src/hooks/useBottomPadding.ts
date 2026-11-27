import { useMemo } from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MEASUREMENTS } from "@/constants/measurements";

/**
 * End-of-content padding for a modal or pushed screen's scroll view, so its last control clears the
 * system bar. Android draws edge to edge under a transparent navigation bar, so the padding is that
 * bar (the bottom safe-area inset) plus 16dp. iOS keeps the style's own `spacing.bottom` (the sheet
 * already ends above the home indicator), so this returns nothing there.
 *
 * Not for anything inside a tab screen: on Android those already end above the tab bar and the
 * navigation bar, and the inset would count the navigation bar twice.
 */
export function useBottomPadding() {
  const { bottom } = useSafeAreaInsets();

  return useMemo(
    () => (Platform.OS === "android" ? { paddingBottom: bottom + MEASUREMENTS.spacing.lg } : undefined),
    [bottom]
  );
}
