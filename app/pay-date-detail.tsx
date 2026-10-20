import { useCallback, useMemo, useState } from "react";
import {
  View,
  FlatList,
  Pressable,
  StyleSheet,
  Linking,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useStore } from "../src/store";
import { useThemeStore } from "../src/stores/themeStore";
import { useColors } from "../src/hooks/useColors";
import { MEASUREMENTS } from "../src/constants/measurements";
import { AppText } from "../src/components/AppText";
import { AppButton } from "../src/components/AppButton";
import { AppInput } from "../src/components/AppInput";

export default function PayDateDetailScreen() {
  const { payDate, sourceId } = useLocalSearchParams<{
    payDate: string;
    sourceId: string;
  }>();

  const colors = useColors();
  const incomeSources = useStore((s) => s.incomeSources);
  const expenses = useStore((s) => s.expenses);
  const assignments = useStore((s) => s.assignments);
  const addExpense = useStore((s) => s.addExpense);
  const assignExpense = useStore((s) => s.assignExpense);
  const unassignExpense = useStore((s) => s.unassignExpense);
  const togglePaid = useStore((s) => s.togglePaid);
  const autoMarkPaid = useThemeStore((s) => s.autoMarkPaidOnLinkTap);

  const [showOneTimeForm, setShowOneTimeForm] = useState(false);
  const [oneTimePayee, setOneTimePayee] = useState("");
  const [oneTimeAmount, setOneTimeAmount] = useState("");

  const incomeSource = useMemo(
    () => incomeSources.find((e) => e.id === sourceId),
    [incomeSources, sourceId]
  );

  const assignedExpenseIds = useMemo(() => {
    const matched = assignments.filter(
      (a) => a.payDate === payDate && a.employerId === sourceId
    );
    return new Map(matched.map((a) => [a.expenseId, { assignmentId: a.id, paid: !!a.paid }]));
  }, [assignments, payDate, sourceId]);

  const linkedExpenseIds = useMemo(() => {
    const ids = new Set<string>();
    for (const e of expenses) {
      if (e.incomeSourceId === sourceId && !assignedExpenseIds.has(e.id)) {
        ids.add(e.id);
      }
    }
    return ids;
  }, [expenses, sourceId, assignedExpenseIds]);

  const assignedExpenses = useMemo(
    () => expenses.filter((e) => assignedExpenseIds.has(e.id) || linkedExpenseIds.has(e.id)),
    [expenses, assignedExpenseIds, linkedExpenseIds]
  );

  const unassignedExpenses = useMemo(
    () => expenses.filter((e) =>
      !assignedExpenseIds.has(e.id) && !linkedExpenseIds.has(e.id)
    ),
    [expenses, assignedExpenseIds, linkedExpenseIds]
  );

  const totalAssigned = useMemo(
    () => assignedExpenses.reduce((sum, e) => sum + e.amount, 0),
    [assignedExpenses]
  );

  const remaining = useMemo(
    () => (incomeSource?.payAmount ?? 0) - totalAssigned,
    [incomeSource, totalAssigned]
  );

  const handleAssign = useCallback(
    (expenseId: string) => {
      assignExpense(expenseId, payDate, sourceId);
    },
    [assignExpense, payDate, sourceId]
  );

  const handleUnassign = useCallback(
    (expenseId: string) => {
      const entry = assignedExpenseIds.get(expenseId);
      if (entry) {
        unassignExpense(entry.assignmentId);
      }
    },
    [unassignExpense, assignedExpenseIds]
  );

  const handleTogglePaid = useCallback(
    (expenseId: string) => {
      const entry = assignedExpenseIds.get(expenseId);
      if (entry) {
        togglePaid(entry.assignmentId);
      } else {
        const id = assignExpense(expenseId, payDate, sourceId);
        togglePaid(id);
      }
    },
    [assignedExpenseIds, togglePaid, assignExpense, payDate, sourceId]
  );

  const handleAddOneTime = useCallback(() => {
    if (!oneTimePayee.trim()) {
      Alert.alert("Error", "Payee name is required.");
      return;
    }
    const parsed = parseFloat(oneTimeAmount);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert("Error", "Enter a valid amount.");
      return;
    }
    const expenseId = addExpense({
      payee: oneTimePayee.trim(),
      amount: parsed,
      isRecurring: false,
      dueDate: payDate,
    });
    assignExpense(expenseId, payDate, sourceId);
    setOneTimePayee("");
    setOneTimeAmount("");
    setShowOneTimeForm(false);
  }, [oneTimePayee, oneTimeAmount, addExpense, assignExpense, payDate, sourceId]);

  const handleOpenLink = useCallback(
    (link: string, expenseId: string) => {
      Linking.openURL(link);
      if (autoMarkPaid) {
        const entry = assignedExpenseIds.get(expenseId);
        if (entry && !entry.paid) {
          togglePaid(entry.assignmentId);
        } else if (!entry) {
          const id = assignExpense(expenseId, payDate, sourceId);
          togglePaid(id);
        }
      }
    },
    [autoMarkPaid, assignedExpenseIds, togglePaid, assignExpense, payDate, sourceId]
  );

  const listData = useMemo(() => {
    const items: {
      key: string;
      type: "header" | "assigned" | "section-title" | "unassigned" | "one-time-form";
      expense?: (typeof expenses)[0];
    }[] = [];

    items.push({ key: "header", type: "header" });

    for (const expense of assignedExpenses) {
      items.push({ key: `assigned-${expense.id}`, type: "assigned", expense });
    }

    if (unassignedExpenses.length > 0) {
      items.push({ key: "section-title", type: "section-title" });
      for (const expense of unassignedExpenses) {
        items.push({
          key: `unassigned-${expense.id}`,
          type: "unassigned",
          expense,
        });
      }
    }

    items.push({ key: "one-time-form", type: "one-time-form" });

    return items;
  }, [assignedExpenses, unassignedExpenses]);

  const renderItem = useCallback(
    ({ item }: { item: (typeof listData)[0] }) => {
      if (item.type === "header") {
        return (
          <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground }]}>
            <AppText variant="h2">{incomeSource?.name ?? "Unknown"}</AppText>
            <AppText variant="subtext" style={styles.summaryDate}>
              {payDate}
            </AppText>
            <View style={[styles.summaryRow, { borderTopColor: colors.border }]}>
              <AppText variant="regular" color="textSecondary">Paycheck</AppText>
              <AppText variant="regular">
                $
                {(incomeSource?.payAmount ?? 0).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </AppText>
            </View>
            <View style={[styles.summaryRow, { borderTopColor: colors.border }]}>
              <AppText variant="regular" color="textSecondary">Expenses</AppText>
              <AppText variant="regular">
                -$
                {totalAssigned.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </AppText>
            </View>
            <View style={[styles.summaryRow, styles.summaryRowLast, { borderTopColor: colors.border }]}>
              <AppText variant="regular" color="textSecondary">Remaining</AppText>
              <AppText
                variant="h3"
                style={{
                  color: remaining < 0 ? colors.destructive : colors.primary,
                }}
              >
                $
                {remaining.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </AppText>
            </View>
          </View>
        );
      }

      if (item.type === "one-time-form") {
        if (!showOneTimeForm) {
          return (
            <AppButton
              title="Add One-Time Expense"
              variant="outline"
              onPress={() => setShowOneTimeForm(true)}
              style={styles.oneTimeButton}
            />
          );
        }
        return (
          <View style={[styles.oneTimeCard, { backgroundColor: colors.cardBackground }]}>
            <AppText variant="label" style={styles.oneTimeLabel}>One-Time Expense</AppText>
            <AppInput
              value={oneTimePayee}
              onChangeText={setOneTimePayee}
              placeholder="Payee"
            />
            <AppInput
              value={oneTimeAmount}
              onChangeText={setOneTimeAmount}
              placeholder="Amount"
              keyboardType="decimal-pad"
              style={styles.oneTimeAmountInput}
            />
            <View style={styles.oneTimeActions}>
              <AppButton
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setShowOneTimeForm(false);
                  setOneTimePayee("");
                  setOneTimeAmount("");
                }}
                style={styles.oneTimeActionButton}
              />
              <AppButton
                title="Add"
                onPress={handleAddOneTime}
                style={styles.oneTimeActionButton}
              />
            </View>
          </View>
        );
      }

      if (item.type === "section-title") {
        return <AppText variant="label" style={styles.sectionTitle}>Available Expenses</AppText>;
      }

      const expense = item.expense!;
      const isAssigned = item.type === "assigned";
      const hasAssignment = assignedExpenseIds.has(expense.id);
      const isLinkedPreload = isAssigned && !hasAssignment;
      const isPaid = isAssigned && !!assignedExpenseIds.get(expense.id)?.paid;

      return (
        <View style={[styles.expenseCard, { backgroundColor: colors.cardBackground }]}>
          {isAssigned ? (
            <Pressable
              onPress={() => handleTogglePaid(expense.id)}
              hitSlop={MEASUREMENTS.hitSlop}
            >
              <Ionicons
                name={isPaid ? "checkbox" : "square-outline"}
                size={22}
                color={isPaid ? colors.primary : colors.textMuted}
                style={styles.checkbox}
              />
            </Pressable>
          ) : null}
          <Pressable
            style={styles.expenseInfo}
            onPress={
              expense.link ? () => handleOpenLink(expense.link!, expense.id) : undefined
            }
          >
            <AppText
              variant="regular-bold"
              style={[
                expense.link ? { color: colors.primary, textDecorationLine: "underline" as const } : undefined,
                isPaid ? { textDecorationLine: "line-through", opacity: 0.4 } : undefined,
              ]}
            >
              {expense.payee}
            </AppText>
            <AppText
              variant="caption"
              style={isPaid ? { textDecorationLine: "line-through", opacity: 0.4 } : undefined}
            >
              $
              {expense.amount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </AppText>
          </Pressable>
          {isLinkedPreload ? null : (
            <AppButton
              title={isAssigned ? "Remove" : "Add"}
              variant={isAssigned ? "destructive" : "primary"}
              onPress={() =>
                isAssigned
                  ? handleUnassign(expense.id)
                  : handleAssign(expense.id)
              }
              style={styles.toggleButton}
            />
          )}
        </View>
      );
    },
    [
      incomeSource,
      payDate,
      totalAssigned,
      remaining,
      colors,
      assignedExpenseIds,
      showOneTimeForm,
      oneTimePayee,
      oneTimeAmount,
      handleAssign,
      handleUnassign,
      handleTogglePaid,
      handleOpenLink,
      handleAddOneTime,
    ]
  );

  return (
    <FlatList
      data={listData}
      keyExtractor={(item) => item.key}
      renderItem={renderItem}
      style={{ backgroundColor: colors.screenBackground }}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: MEASUREMENTS.spacing.lg,
    paddingBottom: MEASUREMENTS.spacing.bottom,
  },
  summaryCard: {
    borderRadius: MEASUREMENTS.radius.xl,
    padding: MEASUREMENTS.spacing.lg,
    marginBottom: MEASUREMENTS.spacing.xl,
  },
  summaryDate: {
    marginTop: MEASUREMENTS.spacing.xs,
    marginBottom: MEASUREMENTS.spacing.lg,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: MEASUREMENTS.spacing.sm + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  summaryRowLast: {
    paddingTop: MEASUREMENTS.spacing.md + 2,
    marginTop: MEASUREMENTS.spacing.sm,
    borderTopWidth: 1,
  },
  sectionTitle: {
    marginBottom: MEASUREMENTS.spacing.md,
    marginTop: MEASUREMENTS.spacing.md,
  },
  expenseCard: {
    borderRadius: MEASUREMENTS.radius.lg,
    padding: MEASUREMENTS.spacing.base + 2,
    marginBottom: MEASUREMENTS.spacing.md,
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    marginRight: MEASUREMENTS.spacing.md,
  },
  expenseInfo: {
    flex: 1,
    marginRight: MEASUREMENTS.spacing.base,
  },
  toggleButton: {
    paddingHorizontal: MEASUREMENTS.spacing.lg,
    paddingVertical: MEASUREMENTS.spacing.md,
  },
  oneTimeButton: {
    marginTop: MEASUREMENTS.spacing.lg,
  },
  oneTimeCard: {
    borderRadius: MEASUREMENTS.radius.lg,
    padding: MEASUREMENTS.spacing.lg,
    marginTop: MEASUREMENTS.spacing.lg,
  },
  oneTimeLabel: {
    marginBottom: MEASUREMENTS.spacing.md,
  },
  oneTimeAmountInput: {
    marginTop: MEASUREMENTS.spacing.md,
  },
  oneTimeActions: {
    flexDirection: "row",
    gap: MEASUREMENTS.spacing.md,
    marginTop: MEASUREMENTS.spacing.lg,
  },
  oneTimeActionButton: {
    flex: 1,
  },
});
