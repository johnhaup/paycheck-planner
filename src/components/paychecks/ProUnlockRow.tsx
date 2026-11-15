import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { FORWARD_CHEVRON } from "@/constants/direction";
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
      <AppText variant="bodyStrong" color="primaryText" center style={styles.label}>{label}</AppText>
      <View style={styles.trailing}>
        <ProBadge />
        <Ionicons name={FORWARD_CHEVRON} size={16} color={colors.primaryText} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    // When the label is as wide as the screen it wraps, and the badge and chevron drop under it
    flexWrap: "wrap",
    gap: MEASUREMENTS.spacing.md,
    paddingVertical: MEASUREMENTS.spacing.xl,
  },
  label: {
    flexShrink: 1,
  },
  // One flex item, so the wrap can never leave the chevron alone on a line (HAU-330)
  trailing: {
    flexDirection: "row",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.md,
  },
});
