import { useMemo } from "react";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/hooks/useLocale";

const TRANSPARENT_HEADER = { backgroundColor: "transparent" };

/**
 * Pass `largeTitle` for the top-level tab screens (iOS collapsing large titles).
 * Those screens render their list as the root view so iOS can collapse the
 * title as it scrolls. On iOS 26+ that hides the large title behind an opaque
 * scroll-edge background, so the bar is see-through at rest (the screen color
 * shows through) and only paints its background once the title has collapsed.
 */
export function useStackScreenOptions(largeTitle = false) {
  const colors = useColors();
  const t = useT();

  return useMemo(
    () => ({
      headerStyle: { backgroundColor: colors.screenBackground },
      headerTintColor: colors.textDefault,
      headerTitleStyle: { fontWeight: "600" as const },
      headerBackTitle: t("common.back"),
      headerShadowVisible: false,
      contentStyle: { backgroundColor: colors.screenBackground },
      ...(largeTitle
        ? {
            headerLargeTitle: true,
            headerLargeTitleShadowVisible: false,
            headerLargeStyle: TRANSPARENT_HEADER,
          }
        : {}),
    }),
    [colors, largeTitle, t]
  );
}
