import { useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";

interface Props {
  label: string;
  value: string;
  onPress: () => void;
}

export function SettingsLinkRow({ label, value, onPress }: Props) {
  const colors = useColors();

  const rowStyle = useMemo(
    () => [styles.row, { backgroundColor: colors.cardBackgroundElevated }],
    [colors]
  );

  return (
    <Pressable style={rowStyle} onPress={onPress} accessibilityRole="button">
      <AppText variant="body" style={styles.label}>{label}</AppText>
      <AppText variant="body" color="textSecondary" numberOfLines={1} style={styles.value}>
        {value}
      </AppText>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.md,
    padding: MEASUREMENTS.spacing.lg,
    borderRadius: MEASUREMENTS.radius.lg,
    marginTop: MEASUREMENTS.spacing.base,
  },
  label: {
    flex: 1,
  },
  value: {
    flexShrink: 1,
  },
});
