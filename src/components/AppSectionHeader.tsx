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

  // Android keeps a text view's old line breaks when new text is laid out wider than the old one
  // was, so after a language switch "رواتب ديسمبر" drew only its first word (#206). The title only
  // changes with the language, so a new title gets a new text view.

  return (
    <View style={stacked ? [styles.header, styles.headerStacked] : styles.header}>
      {stacked ? (
        <AppWordWrapText key={title} variant="section">{title}</AppWordWrapText>
      ) : (
        <AppText key={title} variant="section" style={styles.title}>{title}</AppText>
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
