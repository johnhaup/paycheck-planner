import { useCallback } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useGroupedRowStyles } from "@/hooks/useGroupedRowStyles";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppCheckCircle } from "@/components/AppCheckCircle";
import type { Expense } from "@/types";

interface Props {
  expense: Expense;
  isAssigned: boolean;
  isPaid: boolean;
  /** Linked to the income source but not yet explicitly assigned, so it can't be removed */
  isLinkedPreload: boolean;
  isFirst: boolean;
  isLast: boolean;
  onTogglePaid: (expenseId: string) => void;
  onOpenLink: (link: string, expenseId: string) => void;
  onAssign: (expenseId: string) => void;
  onUnassign: (expenseId: string) => void;
}

export function PayDateExpenseRow({
  expense,
  isAssigned,
  isPaid,
  isLinkedPreload,
  isFirst,
  isLast,
  onTogglePaid,
  onOpenLink,
  onAssign,
  onUnassign,
}: Props) {
  const colors = useColors();
  const { format: formatMoney } = useMoneyFormat();
  const groupedStyles = useGroupedRowStyles(isFirst, isLast);

  const handleTogglePaid = useCallback(() => {
    onTogglePaid(expense.id);
  }, [onTogglePaid, expense.id]);

  const handleOpenLink = useCallback(() => {
    if (expense.link) {
      onOpenLink(expense.link, expense.id);
    }
  }, [onOpenLink, expense.link, expense.id]);

  const handleToggleAssigned = useCallback(() => {
    if (isAssigned) {
      onUnassign(expense.id);
    } else {
      onAssign(expense.id);
    }
  }, [isAssigned, onAssign, onUnassign, expense.id]);

  const textColor = isPaid ? "textMuted" : "textDefault";

  return (
    <View style={groupedStyles.container}>
      <View style={groupedStyles.row}>
        {isAssigned ? (
          <AppCheckCircle
            checked={isPaid}
            onPress={handleTogglePaid}
            accessibilityLabel={`Mark ${expense.payee} paid`}
          />
        ) : null}
        <Pressable
          style={styles.info}
          onPress={expense.link ? handleOpenLink : undefined}
          disabled={!expense.link}
          accessibilityRole={expense.link ? "link" : undefined}
        >
          <View style={styles.titleRow}>
            <AppText variant="body" color={textColor} numberOfLines={1} style={styles.title}>
              {expense.payee}
            </AppText>
            {expense.link ? (
              <Ionicons name="open-outline" size={14} color={colors.textMuted} />
            ) : null}
          </View>
          <AppText variant="meta" color={isPaid ? "textMuted" : "textSecondary"}>
            {formatMoney(expense.amount)}
          </AppText>
        </Pressable>
        {isLinkedPreload ? (
          <AppText variant="caption">Linked</AppText>
        ) : (
          <Pressable
            onPress={handleToggleAssigned}
            hitSlop={MEASUREMENTS.hitSlop}
            accessibilityRole="button"
            accessibilityLabel={`${isAssigned ? "Remove" : "Add"} ${expense.payee}`}
          >
            <Ionicons
              name={isAssigned ? "remove-circle-outline" : "add-circle"}
              size={26}
              color={isAssigned ? colors.textMuted : colors.primary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  info: {
    flex: 1,
    gap: MEASUREMENTS.spacing.xs,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.sm + 2,
  },
  title: {
    flexShrink: 1,
  },
});
