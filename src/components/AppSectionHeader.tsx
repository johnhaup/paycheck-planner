import { View, StyleSheet } from "react-native";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";

interface Props {
  title: string;
  trailing?: string;
}

export function AppSectionHeader({ title, trailing }: Props) {
  return (
    <View style={styles.header}>
      <AppText variant="section" style={styles.title}>{title}</AppText>
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
  title: {
    flexShrink: 1,
  },
  trailing: {
    textTransform: "none",
    letterSpacing: 0,
  },
});
