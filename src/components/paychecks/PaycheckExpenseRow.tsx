import { useCallback, useMemo } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppCheckCircle } from "@/components/AppCheckCircle";
import type {
  LinkTapHandler,
  PaycheckExpense,
  TogglePaidHandler,
} from "@/components/paychecks/types";

interface Props {
  expense: PaycheckExpense;
  payDate: string;
  sourceId: string;
  onTogglePaid: TogglePaidHandler;
  onLinkTap: LinkTapHandler;
}

export function PaycheckExpenseRow({ expense, payDate, sourceId, onTogglePaid, onLinkTap }: Props) {
  const colors = useColors();
  const { format: formatMoney } = useMoneyFormat();

  const handleTogglePaid = useCallback(() => {
    onTogglePaid(expense.assignmentId, expense.expenseId, payDate, sourceId);
  }, [onTogglePaid, expense.assignmentId, expense.expenseId, payDate, sourceId]);

  const handleLinkTap = useCallback(() => {
    if (expense.link) {
      onLinkTap(expense.link, expense.assignmentId, expense.expenseId, payDate, sourceId);
    }
  }, [onLinkTap, expense.link, expense.assignmentId, expense.expenseId, payDate, sourceId]);

  const rowStyle = useMemo(
    () => [styles.row, { borderTopColor: colors.divider }],
    [colors]
  );

  const textColor = expense.paid ? "textMuted" : "textDefault";

  return (
    <View style={rowStyle}>
      <AppCheckCircle
        checked={!!expense.paid}
        onPress={handleTogglePaid}
        accessibilityLabel={`Mark ${expense.payee} paid`}
      />
      <Pressable
        style={styles.content}
        onPress={expense.link ? handleLinkTap : undefined}
        disabled={!expense.link}
        accessibilityRole={expense.link ? "link" : undefined}
      >
        <View style={styles.payee}>
          <AppText variant="body" color={textColor} numberOfLines={1}>
            {expense.payee}
          </AppText>
          {expense.link ? (
            <Ionicons name="open-outline" size={14} color={colors.textMuted} />
          ) : null}
        </View>
        <AppText variant="body" color={textColor}>
          {formatMoney(expense.amount)}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.base,
    paddingHorizontal: MEASUREMENTS.spacing.lg,
    paddingVertical: MEASUREMENTS.spacing.base - 1,
    borderTopWidth: 1,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.md,
  },
  payee: {
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.sm + 2,
  },
});
