import { useCallback, useMemo } from "react";
import { FlatList, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useStore } from "@/store";
import { openPaymentLink } from "@/utils/links";
import { useThemeStore } from "@/stores/themeStore";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { PayDateSummary } from "@/components/payDateDetail/PayDateSummary";
import { PayDateExpenseRow } from "@/components/payDateDetail/PayDateExpenseRow";
import { OneTimeExpenseForm } from "@/components/payDateDetail/OneTimeExpenseForm";
import { getPaycheckOrdinal, isExpenseLinkedToPaycheck } from "@/utils/payDates";
import type { Expense } from "@/types";

type ListItem =
  | { key: string; type: "header" | "section-title" | "one-time-form" }
  | { key: string; type: "assigned" | "unassigned"; expense: Expense };

function keyExtractor(item: ListItem) {
  return item.key;
}

export default function PayDateDetailScreen() {
  const { payDate, sourceId } = useLocalSearchParams<{
    payDate: string;
    sourceId: string;
  }>();

  const colors = useColors();
  const incomeSources = useStore((s) => s.incomeSources);
  const expenses = useStore((s) => s.expenses);
  const assignments = useStore((s) => s.assignments);
  const assignExpense = useStore((s) => s.assignExpense);
  const unassignExpense = useStore((s) => s.unassignExpense);
  const togglePaid = useStore((s) => s.togglePaid);
  const autoMarkPaid = useThemeStore((s) => s.autoMarkPaidOnLinkTap);

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

  const handleOpenLink = useCallback(
    (link: string, expenseId: string) => {
      openPaymentLink(link);
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

  const paycheckOrdinal = useMemo(
    () => (incomeSource ? getPaycheckOrdinal(incomeSource, payDate) : undefined),
    [incomeSource, payDate]
  );

  const linkedExpenseIds = useMemo(() => {
    const ids = new Set<string>();
    for (const e of expenses) {
      if (
        !assignedExpenseIds.has(e.id) &&
        isExpenseLinkedToPaycheck(e, sourceId, paycheckOrdinal, incomeSource)
      ) {
        ids.add(e.id);
      }
    }
    return ids;
  }, [expenses, sourceId, paycheckOrdinal, incomeSource, assignedExpenseIds]);

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

  const listData = useMemo(() => {
    const items: ListItem[] = [{ key: "header", type: "header" }];

    for (const expense of assignedExpenses) {
      items.push({ key: `assigned-${expense.id}`, type: "assigned", expense });
    }

    if (unassignedExpenses.length > 0) {
      items.push({ key: "section-title", type: "section-title" });
      for (const expense of unassignedExpenses) {
        items.push({ key: `unassigned-${expense.id}`, type: "unassigned", expense });
      }
    }

    items.push({ key: "one-time-form", type: "one-time-form" });

    return items;
  }, [assignedExpenses, unassignedExpenses]);

  const listStyle = useMemo(
    () => ({ backgroundColor: colors.screenBackground }),
    [colors]
  );

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      switch (item.type) {
        case "header":
          return (
            <PayDateSummary
              sourceName={incomeSource?.name ?? "Unknown"}
              payDate={payDate}
              payAmount={incomeSource?.payAmount ?? 0}
              totalAssigned={totalAssigned}
              remaining={remaining}
            />
          );
        case "one-time-form":
          return <OneTimeExpenseForm payDate={payDate} sourceId={sourceId} />;
        case "section-title":
          return <AppText variant="label" style={styles.sectionTitle}>Available Expenses</AppText>;
        case "assigned":
        case "unassigned": {
          const isAssigned = item.type === "assigned";
          const entry = assignedExpenseIds.get(item.expense.id);
          return (
            <PayDateExpenseRow
              expense={item.expense}
              isAssigned={isAssigned}
              isPaid={isAssigned && !!entry?.paid}
              isLinkedPreload={isAssigned && !entry}
              onTogglePaid={handleTogglePaid}
              onOpenLink={handleOpenLink}
              onAssign={handleAssign}
              onUnassign={handleUnassign}
            />
          );
        }
      }
    },
    [
      incomeSource,
      payDate,
      sourceId,
      totalAssigned,
      remaining,
      assignedExpenseIds,
      handleAssign,
      handleUnassign,
      handleTogglePaid,
      handleOpenLink,
    ]
  );

  return (
    <FlatList
      data={listData}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      style={listStyle}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: MEASUREMENTS.spacing.lg,
    paddingBottom: MEASUREMENTS.spacing.bottom,
  },
  sectionTitle: {
    marginBottom: MEASUREMENTS.spacing.md,
    marginTop: MEASUREMENTS.spacing.md,
  },
});
