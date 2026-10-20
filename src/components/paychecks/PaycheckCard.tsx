import { useCallback, useMemo } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { format } from "date-fns";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppCard } from "@/components/AppCard";
import { AppDateTile } from "@/components/AppDateTile";
import { AppText } from "@/components/AppText";
import { PaidProgress } from "@/components/paychecks/PaidProgress";
import { PaycheckExpenseRow } from "@/components/paychecks/PaycheckExpenseRow";
import { formatMoney } from "@/utils/money";
import type {
  LinkTapHandler,
  PaycheckItem,
  TogglePaidHandler,
} from "@/components/paychecks/types";

interface Props {
  item: PaycheckItem;
  onPress: (payDate: string, sourceId: string) => void;
  onTogglePaid: TogglePaidHandler;
  onLinkTap: LinkTapHandler;
}

export function PaycheckCard({ item, onPress, onTogglePaid, onLinkTap }: Props) {
  const colors = useColors();

  const handlePress = useCallback(() => {
    onPress(item.payDate, item.sourceId);
  }, [onPress, item.payDate, item.sourceId]);

  const emptyRowStyle = useMemo(
    () => [styles.emptyRow, { borderTopColor: colors.divider }],
    [colors]
  );

  const billCount = item.expenses.length;
  const meta =
    billCount === 0
      ? format(item.date, "EEEE")
      : `${format(item.date, "EEEE")} · ${item.paidCount} of ${billCount} paid`;

  return (
    <AppCard style={styles.card}>
      <Pressable
        style={styles.header}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityHint="Opens this paycheck"
      >
        <AppDateTile date={item.date} />
        <View style={styles.headerText}>
          <AppText variant="rowTitle" numberOfLines={1}>{item.sourceName}</AppText>
          <AppText variant="meta">{meta}</AppText>
        </View>
        <View style={styles.amounts}>
          <AppText variant="rowTitle">{formatMoney(item.payAmount)}</AppText>
          <AppText variant="meta" color={item.remaining < 0 ? "destructive" : "primaryText"}>
            {formatMoney(item.remaining)} left
          </AppText>
        </View>
      </Pressable>
      <PaidProgress paid={item.paidCount} total={billCount} />
      {billCount > 0 ? (
        item.expenses.map((expense) => (
          <PaycheckExpenseRow
            key={expense.assignmentId || expense.expenseId}
            expense={expense}
            payDate={item.payDate}
            sourceId={item.sourceId}
            onTogglePaid={onTogglePaid}
            onLinkTap={onLinkTap}
          />
        ))
      ) : (
        <Pressable style={emptyRowStyle} onPress={handlePress}>
          <AppText variant="meta" color="textMuted">No bills yet · tap to assign</AppText>
        </Pressable>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: MEASUREMENTS.spacing.base,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.base,
    padding: MEASUREMENTS.spacing.lg,
  },
  headerText: {
    flex: 1,
    gap: MEASUREMENTS.spacing.xs,
  },
  amounts: {
    alignItems: "flex-end",
    gap: MEASUREMENTS.spacing.xs,
  },
  emptyRow: {
    paddingHorizontal: MEASUREMENTS.spacing.lg,
    paddingVertical: MEASUREMENTS.spacing.base,
    borderTopWidth: 1,
  },
});
