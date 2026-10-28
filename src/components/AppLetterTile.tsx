import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useIsDark } from "@/hooks/useColors";
import { TILE_TINTS } from "@/constants/palette";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import type { ExpenseIcon } from "@/constants/expenseIcons";

interface Props {
  label: string;
  /** Index into the tint palette; omit for the neutral grey tile */
  tintIndex?: number;
  size?: number;
  /** Replaces the letter */
  icon?: ExpenseIcon;
}

export function AppLetterTile({ label, tintIndex, size = 40, icon }: Props) {
  const isDark = useIsDark();

  const tint = useMemo(() => {
    if (tintIndex === undefined) {
      return isDark ? TILE_TINTS.neutral.dark : TILE_TINTS.neutral.light;
    }
    const tints = isDark ? TILE_TINTS.dark : TILE_TINTS.light;
    return tints[tintIndex % tints.length];
  }, [isDark, tintIndex]);

  const tileStyle = useMemo(
    () => [styles.tile, { width: size, height: size, backgroundColor: tint.background }],
    [size, tint]
  );

  const textStyle = useMemo(() => ({ color: tint.foreground }), [tint]);

  return (
    <View style={tileStyle}>
      {icon ? (
        <Ionicons name={icon} size={Math.round(size / 2)} color={tint.foreground} />
      ) : (
        <AppText variant="rowTitle" style={textStyle}>
          {label.trim().charAt(0).toUpperCase() || "?"}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: MEASUREMENTS.radius.tile,
    alignItems: "center",
    justifyContent: "center",
  },
});
