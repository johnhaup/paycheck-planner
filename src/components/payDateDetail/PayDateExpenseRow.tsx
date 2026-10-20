import { useCallback, useMemo } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppButton } from "@/components/AppButton";
import type { Expense } from "@/types";

interface Props {
  expense: Expense;
  isAssigned: boolean;
  isPaid: boolean;
  /** Linked to the income source but not yet explicitly assigned, so it can't be removed */
  isLinkedPreload: boolean;
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
  onTogglePaid,
  onOpenLink,
  onAssign,
  onUnassign,
}: Props) {
  const colors = useColors();

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

  const cardStyle = useMemo(
    () => [styles.card, { backgroundColor: colors.cardBackground }],
    [colors]
  );

  const payeeStyle = useMemo(
    () => [
      expense.link ? [styles.linkText, { color: colors.primary }] : undefined,
      isPaid ? styles.paidText : undefined,
    ],
    [expense.link, isPaid, colors]
  );

  return (
    <View style={cardStyle}>
      {isAssigned ? (
        <Pressable onPress={handleTogglePaid} hitSlop={MEASUREMENTS.hitSlop}>
          <Ionicons
            name={isPaid ? "checkbox" : "square-outline"}
            size={22}
            color={isPaid ? colors.primary : colors.textMuted}
            style={styles.checkbox}
          />
        </Pressable>
      ) : null}
      <Pressable
        style={styles.info}
        onPress={expense.link ? handleOpenLink : undefined}
      >
        <AppText variant="regular-bold" style={payeeStyle}>
          {expense.payee}
        </AppText>
        <AppText variant="caption" style={isPaid ? styles.paidText : undefined}>
          ${expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </AppText>
      </Pressable>
      {isLinkedPreload ? null : (
        <AppButton
          title={isAssigned ? "Remove" : "Add"}
          variant={isAssigned ? "destructive" : "primary"}
          onPress={handleToggleAssigned}
          style={styles.toggleButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: MEASUREMENTS.radius.lg,
    padding: MEASUREMENTS.spacing.base + 2,
    marginBottom: MEASUREMENTS.spacing.md,
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    marginRight: MEASUREMENTS.spacing.md,
  },
  info: {
    flex: 1,
    marginRight: MEASUREMENTS.spacing.base,
  },
  linkText: {
    textDecorationLine: "underline",
  },
  paidText: {
    textDecorationLine: "line-through",
    opacity: 0.4,
  },
  toggleButton: {
    paddingHorizontal: MEASUREMENTS.spacing.lg,
    paddingVertical: MEASUREMENTS.spacing.md,
  },
});
