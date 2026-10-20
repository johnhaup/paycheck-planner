import { useCallback } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
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

  const handleTogglePaid = useCallback(() => {
    onTogglePaid(expense.assignmentId, expense.expenseId, payDate, sourceId);
  }, [onTogglePaid, expense.assignmentId, expense.expenseId, payDate, sourceId]);

  const handleLinkTap = useCallback(() => {
    if (expense.link) {
      onLinkTap(expense.link, expense.assignmentId, expense.expenseId, payDate, sourceId);
    }
  }, [onLinkTap, expense.link, expense.assignmentId, expense.expenseId, payDate, sourceId]);

  return (
    <View style={styles.row}>
      <Pressable onPress={handleTogglePaid} hitSlop={MEASUREMENTS.hitSlop}>
        <Ionicons
          name={expense.paid ? "checkbox" : "square-outline"}
          size={22}
          color={expense.paid ? colors.primary : colors.textMuted}
          style={styles.checkbox}
        />
      </Pressable>
      <Pressable
        style={styles.content}
        onPress={expense.link ? handleLinkTap : undefined}
      >
        <View style={styles.payeeRow}>
          <AppText variant="regular" style={expense.paid ? styles.paidText : undefined}>
            {expense.payee}
          </AppText>
          {expense.link ? (
            <Ionicons
              name="open-outline"
              size={18}
              color={expense.paid ? colors.textMuted : colors.textDefault}
              style={styles.linkIcon}
            />
          ) : null}
        </View>
        <AppText variant="subtext" style={expense.paid ? styles.paidText : undefined}>
          ${expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: MEASUREMENTS.spacing.lg,
    paddingVertical: MEASUREMENTS.spacing.md,
  },
  checkbox: {
    marginRight: MEASUREMENTS.spacing.md,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  payeeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  linkIcon: {
    marginLeft: MEASUREMENTS.spacing.sm + 2,
  },
  paidText: {
    textDecorationLine: "line-through",
    opacity: 0.4,
  },
});
