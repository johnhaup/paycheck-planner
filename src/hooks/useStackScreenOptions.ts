import { useMemo } from "react";
import { useColors } from "@/hooks/useColors";

/** Pass `largeTitle` for the top-level tab screens (iOS collapsing large titles). */
export function useStackScreenOptions(largeTitle = false) {
  const colors = useColors();

  return useMemo(
    () => ({
      headerStyle: { backgroundColor: colors.screenBackground },
      headerTintColor: colors.textDefault,
      headerTitleStyle: { fontWeight: "600" as const },
      headerBackTitle: "Back",
      headerShadowVisible: false,
      contentStyle: { backgroundColor: colors.screenBackground },
      ...(largeTitle
        ? {
            headerLargeTitle: true,
            headerLargeTitleShadowVisible: false,
            headerLargeStyle: { backgroundColor: colors.screenBackground },
          }
        : {}),
    }),
    [colors, largeTitle]
  );
}
