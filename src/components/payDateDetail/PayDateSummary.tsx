import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";

interface Props {
  sourceName: string;
  payDate: string;
  payAmount: number;
  totalAssigned: number;
  remaining: number;
}

export function PayDateSummary({ sourceName, payDate, payAmount, totalAssigned, remaining }: Props) {
  const colors = useColors();

  const cardStyle = useMemo(
    () => [styles.card, { backgroundColor: colors.cardBackground }],
    [colors]
  );

  const rowStyle = useMemo(
    () => [styles.row, { borderTopColor: colors.border }],
    [colors]
  );

  const lastRowStyle = useMemo(
    () => [styles.row, styles.rowLast, { borderTopColor: colors.border }],
    [colors]
  );

  const remainingStyle = useMemo(
    () => ({ color: remaining < 0 ? colors.destructive : colors.primary }),
    [remaining, colors]
  );

  return (
    <View style={cardStyle}>
      <AppText variant="h2">{sourceName}</AppText>
      <AppText variant="subtext" style={styles.date}>
        {payDate}
      </AppText>
      <View style={rowStyle}>
        <AppText variant="regular" color="textSecondary">Paycheck</AppText>
        <AppText variant="regular">
          ${payAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </AppText>
      </View>
      <View style={rowStyle}>
        <AppText variant="regular" color="textSecondary">Expenses</AppText>
        <AppText variant="regular">
          -${totalAssigned.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </AppText>
      </View>
      <View style={lastRowStyle}>
        <AppText variant="regular" color="textSecondary">Remaining</AppText>
        <AppText variant="h3" style={remainingStyle}>
          ${remaining.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: MEASUREMENTS.radius.xl,
    padding: MEASUREMENTS.spacing.lg,
    marginBottom: MEASUREMENTS.spacing.xl,
  },
  date: {
    marginTop: MEASUREMENTS.spacing.xs,
    marginBottom: MEASUREMENTS.spacing.lg,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: MEASUREMENTS.spacing.sm + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowLast: {
    paddingTop: MEASUREMENTS.spacing.md + 2,
    marginTop: MEASUREMENTS.spacing.sm,
    borderTopWidth: 1,
  },
});
