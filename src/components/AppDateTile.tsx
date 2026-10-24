import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { formatDayOfMonth, formatMonthShort } from "@/utils/dates";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";

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
      <AppText variant="caption" color="primaryText" style={styles.month}>
        {formatMonthShort(date).toUpperCase()}
      </AppText>
      <AppText variant="rowTitle" style={styles.day}>
        {formatDayOfMonth(date)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 44,
    height: 48,
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
