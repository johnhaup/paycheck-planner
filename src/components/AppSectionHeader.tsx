import { View, StyleSheet } from "react-native";
import { MEASUREMENTS } from "@/constants/measurements";
import { useAccessibilityTextSize } from "@/hooks/useAccessibilityTextSize";
import { AppText } from "@/components/AppText";
import { AppWordWrapText } from "@/components/AppWordWrapText";

interface Props {
  title: string;
  trailing?: string;
}

export function AppSectionHeader({ title, trailing }: Props) {
  const stacked = useAccessibilityTextSize();

  return (
    <View style={stacked ? [styles.header, styles.headerStacked] : styles.header}>
      {stacked ? (
        <AppWordWrapText variant="section">{title}</AppWordWrapText>
      ) : (
        <AppText variant="section" style={styles.title}>{title}</AppText>
      )}
      {trailing ? <AppText variant="section" style={styles.trailing}>{trailing}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: MEASUREMENTS.spacing.md,
    marginTop: MEASUREMENTS.spacing.xxl,
    marginBottom: MEASUREMENTS.spacing.md + 2,
    paddingHorizontal: MEASUREMENTS.spacing.xs,
  },
  headerStacked: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: MEASUREMENTS.spacing.xs,
  },
  title: {
    flexShrink: 1,
  },
  trailing: {
    textTransform: "none",
    letterSpacing: 0,
  },
});
