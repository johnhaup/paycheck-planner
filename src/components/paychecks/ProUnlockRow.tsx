import { Pressable, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { ProBadge } from "@/components/ProBadge";

interface Props {
  label: string;
  onPress: () => void;
}

/** Where the free months end in the Paychecks list: opens the paywall for the months Pro adds. */
export function ProUnlockRow({ label, onPress }: Props) {
  const colors = useColors();

  return (
    <Pressable style={styles.row} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <AppText variant="bodyStrong" color="primaryText" style={styles.label}>{label}</AppText>
      <ProBadge />
      <Ionicons name="chevron-forward" size={16} color={colors.primaryText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: MEASUREMENTS.spacing.md,
    paddingVertical: MEASUREMENTS.spacing.xl,
  },
  label: {
    flexShrink: 1,
  },
});
