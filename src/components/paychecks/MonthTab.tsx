import { useCallback, useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";

interface Props {
  monthKey: string;
  label: string;
  selected: boolean;
  onSelect: (monthKey: string) => void;
}

export function MonthTab({ monthKey, label, selected, onSelect }: Props) {
  const colors = useColors();

  const handlePress = useCallback(() => {
    onSelect(monthKey);
  }, [onSelect, monthKey]);

  const tabStyle = useMemo(
    () => [
      styles.tab,
      {
        backgroundColor: colors.cardBackground,
        borderColor: selected ? colors.primary : colors.cardBackground,
      },
    ],
    [selected, colors]
  );

  const labelStyle = useMemo(
    () => ({ color: selected ? colors.textDefault : colors.textMuted }),
    [selected, colors]
  );

  return (
    <Pressable onPress={handlePress} style={tabStyle}>
      <AppText variant="regular" style={labelStyle}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tab: {
    paddingHorizontal: MEASUREMENTS.spacing.lg,
    paddingVertical: MEASUREMENTS.spacing.md,
    borderRadius: MEASUREMENTS.radius.md,
    borderWidth: 2,
  },
});
