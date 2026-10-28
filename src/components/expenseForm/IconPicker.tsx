import { useCallback, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/hooks/useLocale";
import { MEASUREMENTS } from "@/constants/measurements";
import { EXPENSE_ICONS, type ExpenseIcon } from "@/constants/expenseIcons";
import { AppText } from "@/components/AppText";
import { hapticSelection } from "@/utils/haptics";

const TILE_SIZE = 44;

interface Props {
  /** Shown on the "no icon" tile */
  letter: string;
  value: ExpenseIcon | undefined;
  onChange: (icon: ExpenseIcon | undefined) => void;
}

export function IconPicker({ letter, value, onChange }: Props) {
  const t = useT();

  return (
    <View style={styles.grid}>
      <IconTile
        value={undefined}
        selected={!value}
        letter={letter}
        accessibilityLabel={t("expenses.form.noIcon")}
        onSelect={onChange}
      />
      {EXPENSE_ICONS.map((icon) => (
        <IconTile
          key={icon}
          value={icon}
          selected={value === icon}
          accessibilityLabel={t(`expenses.icons.${icon}`)}
          onSelect={onChange}
        />
      ))}
    </View>
  );
}

interface IconTileProps {
  value: ExpenseIcon | undefined;
  selected: boolean;
  letter?: string;
  accessibilityLabel: string;
  onSelect: (icon: ExpenseIcon | undefined) => void;
}

function IconTile({ value, selected, letter, accessibilityLabel, onSelect }: IconTileProps) {
  const colors = useColors();

  const handlePress = useCallback(() => {
    if (!selected) {
      hapticSelection();
    }
    onSelect(value);
  }, [onSelect, value, selected]);

  const tileStyle = useMemo(
    () => [
      styles.tile,
      {
        backgroundColor: selected ? colors.primary : colors.inputBackground,
        borderColor: selected ? colors.primary : colors.border,
      },
    ],
    [selected, colors]
  );

  const accessibilityState = useMemo(() => ({ selected }), [selected]);
  const foreground = selected ? colors.onPrimary : colors.textSecondary;
  const letterStyle = useMemo(() => ({ color: foreground }), [foreground]);

  return (
    <Pressable
      style={tileStyle}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
    >
      {value ? (
        <Ionicons name={value} size={20} color={foreground} />
      ) : (
        <AppText variant="bodyStrong" style={letterStyle}>
          {letter?.trim().charAt(0).toUpperCase() || "?"}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: MEASUREMENTS.spacing.md,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: MEASUREMENTS.radius.tile,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
});
