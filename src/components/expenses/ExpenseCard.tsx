import { useCallback, useMemo } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppSwipeToDelete } from "@/components/AppSwipeToDelete";
import type { Expense } from "@/types";

interface Props {
  expense: Expense;
  linkLabel?: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenLink: (link: string) => void;
}

export function ExpenseCard({ expense, linkLabel, onEdit, onDelete, onOpenLink }: Props) {
  const colors = useColors();

  const handlePress = useCallback(() => {
    onEdit(expense.id);
  }, [onEdit, expense.id]);

  const handleDelete = useCallback(() => {
    onDelete(expense.id);
  }, [onDelete, expense.id]);

  const handleOpenLink = useCallback(() => {
    if (expense.link) {
      onOpenLink(expense.link);
    }
  }, [onOpenLink, expense.link]);

  const cardStyle = useMemo(
    () => [styles.card, { backgroundColor: colors.cardBackground }],
    [colors]
  );

  return (
    <AppSwipeToDelete
      confirmTitle="Delete Expense"
      confirmMessage={`Delete "${expense.payee}" and all its assignments?`}
      onConfirm={handleDelete}
      style={styles.swipeable}
    >
      <Pressable style={cardStyle} onPress={handlePress}>
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <AppText variant="h3">{expense.payee}</AppText>
            {expense.link ? (
              <Pressable onPress={handleOpenLink}>
                <AppText variant="caption" color="primary">
                  Open payment link
                </AppText>
              </Pressable>
            ) : null}
          </View>
          <AppText variant="h3" color="primary">
            ${expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </AppText>
        </View>
        {linkLabel ? (
          <AppText variant="caption" color="textMuted" style={styles.linkedSource}>
            Linked to {linkLabel}
          </AppText>
        ) : null}
        {!expense.isRecurring ? (
          <AppText variant="caption" style={styles.recurrence}>One-time</AppText>
        ) : null}
      </Pressable>
    </AppSwipeToDelete>
  );
}

const styles = StyleSheet.create({
  swipeable: {
    marginBottom: MEASUREMENTS.spacing.md + 2,
  },
  card: {
    padding: MEASUREMENTS.spacing.lg,
    borderRadius: MEASUREMENTS.radius.lg,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLeft: {
    flex: 1,
    marginRight: MEASUREMENTS.spacing.base,
  },
  linkedSource: {
    marginTop: MEASUREMENTS.spacing.sm,
  },
  recurrence: {
    marginTop: MEASUREMENTS.spacing.sm,
  },
});
