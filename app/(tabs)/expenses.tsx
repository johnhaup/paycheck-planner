import { useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "../../src/store";
import { useColors } from "../../src/hooks/useColors";
import { MEASUREMENTS } from "../../src/constants/measurements";
import { AppText } from "../../src/components/AppText";
import { AppButton } from "../../src/components/AppButton";
import type { Expense } from "../../src/types";

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

  const renderItem = useCallback(
    ({ item }: { item: Expense }) => (
      <Pressable
        style={[styles.card, { backgroundColor: colors.cardBackground }]}
        onPress={() => handleEdit(item.id)}
        onLongPress={() => handleDelete(item)}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <AppText variant="h3">{item.payee}</AppText>
            {item.link ? (
              <Pressable onPress={() => handleOpenLink(item.link!)}>
                <AppText variant="caption" color="primary">
                  Open payment link
                </AppText>
              </Pressable>
            ) : null}
          </View>
          <AppText variant="h3" color="primary">
            ${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </AppText>
        </View>
        {item.incomeSourceId ? (
          <AppText variant="caption" color="textMuted" style={styles.linkedSource}>
            Linked to {incomeSources.find((s) => s.id === item.incomeSourceId)?.name ?? "Unknown"}
          </AppText>
        ) : null}
        {!item.isRecurring ? (
          <AppText variant="caption" style={styles.recurrence}>One-time</AppText>
        ) : null}
      </Pressable>
    ),
    [handleEdit, handleDelete, handleOpenLink, colors, incomeSources]
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

  if (expenses.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.screenBackground }]}>
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
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      style={{ backgroundColor: colors.screenBackground }}
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
  card: {
    padding: MEASUREMENTS.spacing.lg,
    borderRadius: MEASUREMENTS.radius.lg,
    marginBottom: MEASUREMENTS.spacing.md + 2,
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
