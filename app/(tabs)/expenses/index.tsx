import { useCallback, useMemo } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "@/store";
import { openPaymentLink } from "@/utils/links";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppFab } from "@/components/AppFab";
import { ExpenseCard } from "@/components/expenses/ExpenseCard";
import { getLinkedOrdinal, getPaycheckSlotLabel } from "@/utils/payDates";
import type { Expense, IncomeSource } from "@/types";

function keyExtractor(item: Expense) {
  return item.id;
}

function getLinkLabel(expense: Expense, source: IncomeSource | undefined) {
  if (!source) return "Unknown";
  const ordinal = getLinkedOrdinal(expense, source);
  return ordinal === undefined
    ? source.name
    : `${source.name} · ${getPaycheckSlotLabel(source, ordinal)} each month`;
}

export default function ExpensesScreen() {
  const router = useRouter();
  const colors = useColors();
  const expenses = useStore((s) => s.expenses);
  const incomeSources = useStore((s) => s.incomeSources);
  const deleteExpense = useStore((s) => s.deleteExpense);

  const handleAdd = useCallback(() => {
    router.push("/expense-form");
  }, [router]);

  const handleEdit = useCallback(
    (id: string) => {
      router.push({ pathname: "/expense-form", params: { id } });
    },
    [router]
  );

  const sourcesById = useMemo(
    () => new Map(incomeSources.map((s) => [s.id, s])),
    [incomeSources]
  );

  const renderItem = useCallback(
    ({ item }: { item: Expense }) => (
      <ExpenseCard
        expense={item}
        linkLabel={
          item.incomeSourceId
            ? getLinkLabel(item, sourcesById.get(item.incomeSourceId))
            : undefined
        }
        onEdit={handleEdit}
        onDelete={deleteExpense}
        onOpenLink={openPaymentLink}
      />
    ),
    [handleEdit, deleteExpense, sourcesById]
  );

  const containerStyle = useMemo(
    () => [styles.container, { backgroundColor: colors.screenBackground }],
    [colors]
  );

  return (
    <View style={containerStyle}>
      {expenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <AppText variant="subtext" color="textMuted">
            No expenses added yet.
          </AppText>
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.listContent}
        />
      )}
      <AppFab accessibilityLabel="Add expense" onPress={handleAdd} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: MEASUREMENTS.spacing.lg,
    paddingBottom: MEASUREMENTS.fabSize + MEASUREMENTS.spacing.bottom,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: MEASUREMENTS.spacing.section,
  },
});
