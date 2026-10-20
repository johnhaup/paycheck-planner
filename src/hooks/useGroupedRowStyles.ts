import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";

/**
 * Styles for a row that is one slice of a grouped card in a flat list: the
 * first and last rows round the card's corners, and rows after the first draw
 * the divider.
 */
export function useGroupedRowStyles(isFirst: boolean, isLast: boolean) {
  const colors = useColors();

  return useMemo(
    () => ({
      container: [
        styles.container,
        { backgroundColor: colors.destructive },
        isFirst ? styles.first : undefined,
        isLast ? styles.last : undefined,
      ],
      row: [
        styles.row,
        { backgroundColor: colors.cardBackground },
        isFirst ? undefined : { borderTopWidth: 1, borderTopColor: colors.divider },
      ],
    }),
    [colors, isFirst, isLast]
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  first: {
    borderTopLeftRadius: MEASUREMENTS.radius.card,
    borderTopRightRadius: MEASUREMENTS.radius.card,
  },
  last: {
    borderBottomLeftRadius: MEASUREMENTS.radius.card,
    borderBottomRightRadius: MEASUREMENTS.radius.card,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.base,
    paddingHorizontal: MEASUREMENTS.spacing.lg,
    paddingVertical: MEASUREMENTS.spacing.base + 2,
  },
});
