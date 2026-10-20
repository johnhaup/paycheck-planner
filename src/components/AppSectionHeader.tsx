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
      <AppText variant="section">{title}</AppText>
      {trailing ? <AppText variant="section" style={styles.trailing}>{trailing}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: MEASUREMENTS.spacing.xxl,
    marginBottom: MEASUREMENTS.spacing.md + 2,
    paddingHorizontal: MEASUREMENTS.spacing.xs,
  },
  trailing: {
    textTransform: "none",
    letterSpacing: 0,
  },
});
