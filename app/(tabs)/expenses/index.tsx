import { useCallback, useMemo } from "react";
import { View, FlatList, StyleSheet, Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "@/store";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppButton } from "@/components/AppButton";
import { ExpenseCard } from "@/components/expenses/ExpenseCard";
import type { Expense } from "@/types";

function keyExtractor(item: Expense) {
  return item.id;
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

  const handleDelete = useCallback(
    (expense: Expense) => {
      Alert.alert(
        "Delete Expense",
        `Delete "${expense.payee}" and all its assignments?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => deleteExpense(expense.id),
          },
        ]
      );
    },
    [deleteExpense]
  );

  const handleOpenLink = useCallback((link: string) => {
    Linking.openURL(link);
  }, []);

  const sourceNamesById = useMemo(
    () => new Map(incomeSources.map((s) => [s.id, s.name])),
    [incomeSources]
  );

  const renderItem = useCallback(
    ({ item }: { item: Expense }) => (
      <ExpenseCard
        expense={item}
        linkedSourceName={item.incomeSourceId ? sourceNamesById.get(item.incomeSourceId) : undefined}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onOpenLink={handleOpenLink}
      />
    ),
    [handleEdit, handleDelete, handleOpenLink, sourceNamesById]
  );

  const footer = useMemo(
    () => (
      <AppButton
        title="Add Expense"
        onPress={handleAdd}
        style={styles.addButton}
      />
    ),
    [handleAdd]
  );

  const listStyle = useMemo(
    () => ({ backgroundColor: colors.screenBackground }),
    [colors]
  );

  const emptyContainerStyle = useMemo(
    () => [styles.emptyContainer, listStyle],
    [listStyle]
  );

  if (expenses.length === 0) {
    return (
      <View style={emptyContainerStyle}>
        <AppText variant="subtext" color="textMuted" style={styles.emptyText}>
          No expenses added yet.
        </AppText>
        <AppButton title="Add Expense" onPress={handleAdd} />
      </View>
    );
  }

  return (
    <FlatList
      data={expenses}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentInsetAdjustmentBehavior="automatic"
      style={listStyle}
      contentContainerStyle={styles.listContent}
      ListFooterComponent={footer}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    padding: MEASUREMENTS.spacing.lg,
    paddingBottom: MEASUREMENTS.spacing.bottom,
  },
  addButton: {
    marginTop: MEASUREMENTS.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: MEASUREMENTS.spacing.section,
  },
  emptyText: {
    marginBottom: MEASUREMENTS.spacing.xl,
  },
});
