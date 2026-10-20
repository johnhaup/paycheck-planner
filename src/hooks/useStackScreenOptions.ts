import { useMemo } from "react";
import { useColors } from "@/hooks/useColors";

export function useStackScreenOptions() {
  const colors = useColors();

  return useMemo(
    () => ({
      headerStyle: { backgroundColor: colors.screenBackground },
      headerTintColor: colors.textDefault,
      headerTitleStyle: { fontWeight: "600" as const },
      headerBackTitle: "Back",
      contentStyle: { backgroundColor: colors.screenBackground },
    }),
    [colors]
  );
}
