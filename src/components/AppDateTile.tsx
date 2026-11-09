import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { formatDayOfMonth, formatMonthShort } from "@/utils/dates";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";

/** The tile is a fixed 44×48 badge: its text stops growing at the size that still fits */
const MAX_FONT_MULTIPLIER = 1.3;
/** Long month abbreviations (vi "THG 11") shrink this far before they would truncate */
const MONTH_MIN_FONT_SCALE = 0.5;

interface Props {
  date: Date;
}

export function AppDateTile({ date }: Props) {
  const colors = useColors();

  const tileStyle = useMemo(
    () => [styles.tile, { backgroundColor: colors.cardBackgroundElevated }],
    [colors]
  );

  return (
    <View style={tileStyle}>
      <AppText
        variant="caption"
        color="primaryText"
        style={styles.month}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={MONTH_MIN_FONT_SCALE}
        maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}
      >
        {formatMonthShort(date).toUpperCase()}
      </AppText>
      <AppText variant="rowTitle" style={styles.day} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
        {formatDayOfMonth(date)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 44,
    height: 48,
    paddingHorizontal: MEASUREMENTS.spacing.xs,
    borderRadius: MEASUREMENTS.radius.tile,
    alignItems: "center",
    justifyContent: "center",
  },
  month: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  day: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
});
