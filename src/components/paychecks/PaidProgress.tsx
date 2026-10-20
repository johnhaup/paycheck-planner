import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";

interface Props {
  paid: number;
  total: number;
}

export function PaidProgress({ paid, total }: Props) {
  const colors = useColors();

  // One segment per bill reads well up to about a dozen; beyond that, collapse to a bar
  const segments = useMemo(
    () =>
      total <= 12
        ? Array.from({ length: total }, (_, i) => ({
            key: i,
            style: [styles.segment, { backgroundColor: i < paid ? colors.primary : colors.border }],
          }))
        : [
            {
              key: 0,
              style: [
                styles.segment,
                { flex: Math.max(paid, 0.001), backgroundColor: colors.primary },
              ],
            },
            {
              key: 1,
              style: [
                styles.segment,
                { flex: Math.max(total - paid, 0.001), backgroundColor: colors.border },
              ],
            },
          ],
    [paid, total, colors]
  );

  if (total === 0) return null;

  return (
    <View style={styles.row}>
      {segments.map((segment) => (
        <View key={segment.key} style={segment.style} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: MEASUREMENTS.spacing.sm,
    paddingHorizontal: MEASUREMENTS.spacing.lg,
    paddingBottom: MEASUREMENTS.spacing.base,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
});
