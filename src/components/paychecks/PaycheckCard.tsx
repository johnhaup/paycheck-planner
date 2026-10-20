import { useCallback, useMemo } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { PaycheckExpenseRow } from "@/components/paychecks/PaycheckExpenseRow";
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

  const cardStyle = useMemo(
    () => [styles.card, { backgroundColor: colors.cardBackground }],
    [colors]
  );

  const dividerStyle = useMemo(
    () => [styles.divider, { backgroundColor: colors.border }],
    [colors]
  );

  const footerStyle = useMemo(
    () => [styles.footer, { borderTopColor: colors.border }],
    [colors]
  );

  const remainingStyle = useMemo(
    () => ({ color: item.remaining < 0 ? colors.destructive : colors.primary }),
    [item.remaining, colors]
  );

  return (
    <Pressable onPress={handlePress} style={cardStyle}>
      <View style={styles.header}>
        <AppText variant="h3">{item.title}</AppText>
        <AppText variant="caption">{item.sourceName}</AppText>
      </View>
      <View style={dividerStyle} />
      {item.expenses.length > 0 ? (
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
        <AppText variant="subtext" color="textMuted" center style={styles.noExpenses}>
          Tap to assign expenses
        </AppText>
      )}
      <View style={footerStyle}>
        <AppText variant="subtext">
          ${item.payAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </AppText>
        <AppText variant="regular-bold" style={remainingStyle}>
          ${item.remaining.toLocaleString("en-US", { minimumFractionDigits: 2 })} left
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: MEASUREMENTS.radius.xl,
    marginBottom: MEASUREMENTS.spacing.base,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: MEASUREMENTS.spacing.lg,
    paddingTop: MEASUREMENTS.spacing.base,
    paddingBottom: MEASUREMENTS.spacing.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: MEASUREMENTS.spacing.lg,
  },
  noExpenses: {
    paddingVertical: MEASUREMENTS.spacing.base,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: MEASUREMENTS.spacing.lg,
    paddingVertical: MEASUREMENTS.spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
