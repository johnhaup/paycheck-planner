import { useCallback, useMemo } from "react";
import { FlatList, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useStore } from "@/store";
import { openPaymentLink } from "@/utils/links";
import { useThemeStore } from "@/stores/themeStore";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/hooks/useLocale";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppSectionHeader } from "@/components/AppSectionHeader";
import { PayDateSummary } from "@/components/payDateDetail/PayDateSummary";
import { PayDateExpenseRow } from "@/components/payDateDetail/PayDateExpenseRow";
import { OneTimeExpenseForm } from "@/components/payDateDetail/OneTimeExpenseForm";
import { getPaycheck, isExpenseLinkedToPaycheck } from "@/utils/payDates";
import { getPayAmount } from "@/utils/paycheckMonths";
import type { Expense } from "@/types";

type ListItem =
  | { key: string; type: "header" | "one-time-form" | "empty" }
  | { key: string; type: "section-title"; title: string; trailing?: string }
  | {
      key: string;
      type: "assigned" | "unassigned";
      expense: Expense;
      isFirst: boolean;
      isLast: boolean;
    };

function keyExtractor(item: ListItem) {
  return item.key;
}

export default function PayDateDetailScreen() {
  const { payDate, sourceId } = useLocalSearchParams<{
    payDate: string;
    sourceId: string;
  }>();

  const router = useRouter();
  const colors = useColors();
  const t = useT();
  const incomeSources = useStore((s) => s.incomeSources);
  const expenses = useStore((s) => s.expenses);
  const assignments = useStore((s) => s.assignments);
  const paycheckOverrides = useStore((s) => s.paycheckOverrides);
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
    return new Map(
      matched.map((a) => [a.expenseId, { assignmentId: a.id, paid: !!a.paid, amount: a.amount }])
    );
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

  const handleEditAmount = useCallback(
    (expenseId: string) => {
      router.push({
        pathname: "/expense-amount",
        params: { expenseId, payDate, sourceId },
      });
    },
    [router, payDate, sourceId]
  );

  const handleEditPayAmount = useCallback(() => {
    router.push({
      pathname: "/paycheck-amount",
      params: { payDate, sourceId },
    });
  }, [router, payDate, sourceId]);

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

  const paycheck = useMemo(
    () => (incomeSource ? getPaycheck(incomeSource, payDate) : undefined),
    [incomeSource, payDate]
  );

  const linkedExpenseIds = useMemo(() => {
    const ids = new Set<string>();
    for (const e of expenses) {
      if (
        !assignedExpenseIds.has(e.id) &&
        isExpenseLinkedToPaycheck(e, sourceId, paycheck, incomeSource)
      ) {
        ids.add(e.id);
      }
    }
    return ids;
  }, [expenses, sourceId, paycheck, incomeSource, assignedExpenseIds]);

  const assignedExpenses = useMemo(
    () => expenses.filter((e) => assignedExpenseIds.has(e.id) || linkedExpenseIds.has(e.id)),
    [expenses, assignedExpenseIds, linkedExpenseIds]
  );

  // One-time bills live on a single paycheck; they're moved from the expense form, not added twice
  const scheduledElsewhereIds = useMemo(() => {
    const oneTimeIds = new Set(expenses.filter((e) => !e.isRecurring).map((e) => e.id));
    return new Set(
      assignments
        .filter((a) => oneTimeIds.has(a.expenseId) && !(a.payDate === payDate && a.employerId === sourceId))
        .map((a) => a.expenseId)
    );
  }, [expenses, assignments, payDate, sourceId]);

  const unassignedExpenses = useMemo(
    () => expenses.filter((e) =>
      !assignedExpenseIds.has(e.id) && !linkedExpenseIds.has(e.id) && !scheduledElsewhereIds.has(e.id)
    ),
    [expenses, assignedExpenseIds, linkedExpenseIds, scheduledElsewhereIds]
  );

  const totalAssigned = useMemo(
    () =>
      assignedExpenses.reduce(
        (sum, e) => sum + (assignedExpenseIds.get(e.id)?.amount ?? e.amount),
        0
      ),
    [assignedExpenses, assignedExpenseIds]
  );

  const payAmount = useMemo(
    () => (incomeSource ? getPayAmount(incomeSource, payDate, paycheckOverrides) : 0),
    [incomeSource, payDate, paycheckOverrides]
  );

  const remaining = useMemo(() => payAmount - totalAssigned, [payAmount, totalAssigned]);

  const listData = useMemo(() => {
    const items: ListItem[] = [
      { key: "header", type: "header" },
      {
        key: "assigned-title",
        type: "section-title",
        title: t("payDate.thisPaycheck"),
        trailing: String(assignedExpenses.length),
      },
    ];

    if (assignedExpenses.length === 0) {
      items.push({ key: "empty", type: "empty" });
    }
    assignedExpenses.forEach((expense, i) => {
      items.push({
        key: `assigned-${expense.id}`,
        type: "assigned",
        expense,
        isFirst: i === 0,
        isLast: i === assignedExpenses.length - 1,
      });
    });

    if (unassignedExpenses.length > 0) {
      items.push({ key: "available-title", type: "section-title", title: t("payDate.available") });
      unassignedExpenses.forEach((expense, i) => {
        items.push({
          key: `unassigned-${expense.id}`,
          type: "unassigned",
          expense,
          isFirst: i === 0,
          isLast: i === unassignedExpenses.length - 1,
        });
      });
    }

    items.push({ key: "one-time-form", type: "one-time-form" });

    return items;
  }, [assignedExpenses, unassignedExpenses, t]);

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
              sourceName={incomeSource?.name ?? t("common.unknown")}
              payDate={payDate}
              payAmount={payAmount}
              totalAssigned={totalAssigned}
              remaining={remaining}
              onEditPayAmount={handleEditPayAmount}
            />
          );
        case "one-time-form":
          return <OneTimeExpenseForm payDate={payDate} sourceId={sourceId} />;
        case "section-title":
          return <AppSectionHeader title={item.title} trailing={item.trailing} />;
        case "empty":
          return (
            <AppText variant="meta" style={styles.empty}>
              {t("payDate.emptyAssigned")}
            </AppText>
          );
        case "assigned":
        case "unassigned": {
          const isAssigned = item.type === "assigned";
          const entry = assignedExpenseIds.get(item.expense.id);
          return (
            <PayDateExpenseRow
              expense={item.expense}
              amount={(isAssigned ? entry?.amount : undefined) ?? item.expense.amount}
              isAssigned={isAssigned}
              isPaid={isAssigned && !!entry?.paid}
              isLinkedPreload={isAssigned && !entry}
              isFirst={item.isFirst}
              isLast={item.isLast}
              onTogglePaid={handleTogglePaid}
              onOpenLink={handleOpenLink}
              onAssign={handleAssign}
              onUnassign={handleUnassign}
              onEditAmount={handleEditAmount}
            />
          );
        }
      }
    },
    [
      incomeSource,
      payDate,
      sourceId,
      payAmount,
      totalAssigned,
      remaining,
      handleEditPayAmount,
      assignedExpenseIds,
      handleAssign,
      handleUnassign,
      handleTogglePaid,
      handleOpenLink,
      handleEditAmount,
      t,
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
    padding: MEASUREMENTS.spacing.gutter,
    paddingBottom: MEASUREMENTS.spacing.bottom,
  },
  empty: {
    paddingHorizontal: MEASUREMENTS.spacing.xs,
  },
});
