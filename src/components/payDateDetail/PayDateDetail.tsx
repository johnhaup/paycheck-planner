import { useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  FlatList,
  StyleSheet,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useNavigation, useRouter } from "expo-router";
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
import { MarkAllPaidButton, markAllPaidHeaderRight } from "@/components/payDateDetail/MarkAllPaidButton";
import { usePaycheckBills } from "@/hooks/usePaycheckBills";
import { billsFirst } from "@/utils/paycheckBills";
import { getPayAmount } from "@/utils/paycheckMonths";
import { useProGate } from "@/hooks/useProGate";
import type { Expense } from "@/types";
import { LayoutAnimationConfig } from "react-native-reanimated";
import { AppAnimatedListCell } from "@/components/AppAnimatedListCell";

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

// The inline one-time expense form sits at the bottom of the list, so the
// list itself has to scroll its inputs clear of the keyboard.
function renderScrollComponent(props: ScrollViewProps) {
  return <KeyboardAwareScrollView {...props} bottomOffset={MEASUREMENTS.keyboardOffset} />;
}

type Navigation = {
  setOptions(options: { headerRight: (() => ReactNode) | undefined }): void;
};

interface Props {
  payDate: string;
  sourceId: string;
  /** Side and bottom padding for where the list is shown */
  contentContainerStyle: StyleProp<ViewStyle>;
  /**
   * Beside the Paychecks list on a regular-width screen instead of on its own screen: there is no
   * navigation bar of its own to hold "Mark all paid", so it sits in the summary.
   */
  embedded?: boolean;
}

/** One paycheck: what is left, its bills, the bills that could be added, and a one-time expense form. */
export function PayDateDetail({ payDate, sourceId, contentContainerStyle, embedded }: Props) {
  const router = useRouter();
  const navigation = useNavigation<Navigation>();
  const colors = useColors();
  const contentStyle = useMemo(() => [styles.listContent, contentContainerStyle], [contentContainerStyle]);
  const t = useT();
  const expenses = useStore((s) => s.expenses);
  const assignments = useStore((s) => s.assignments);
  const paycheckOverrides = useStore((s) => s.paycheckOverrides);
  const assignExpense = useStore((s) => s.assignExpense);
  const unassignExpense = useStore((s) => s.unassignExpense);
  const togglePaid = useStore((s) => s.togglePaid);
  const autoMarkPaid = useThemeStore((s) => s.autoMarkPaidOnLinkTap);
  // Changing one paycheck's bill or pay amount is Pro
  const { gate } = useProGate();

  const { incomeSource, assignedExpenseIds, linkedExpenseIds, assignedExpenses, unpaidExpenseIds } =
    usePaycheckBills(payDate, sourceId);

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

  const handleEditAmount = useMemo(
    () =>
      gate((expenseId: string) => {
        router.push({
          pathname: "/expense-amount",
          params: { expenseId, payDate, sourceId },
        });
      }),
    [gate, router, payDate, sourceId]
  );

  const handleEditPayAmount = useMemo(
    () =>
      gate(() => {
        router.push({
          pathname: "/paycheck-amount",
          params: { payDate, sourceId },
        });
      }),
    [gate, router, payDate, sourceId]
  );

  const handleMoveBill = useCallback(() => {
    router.push({
      pathname: "/move-bill",
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
    () =>
      expenses
        .filter(
          (e) =>
            !assignedExpenseIds.has(e.id) &&
            !linkedExpenseIds.has(e.id) &&
            !scheduledElsewhereIds.has(e.id)
        )
        .sort(billsFirst),
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

  const canMoveBill = unpaidExpenseIds.length > 0;

  // The route's options (app/(tabs)/(paychecks)/_layout.tsx) put "Mark all paid" in the bar at push time,
  // so this only follows a later change (#191).
  const buttonInBar = useRef(canMoveBill);

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
              canMoveBill={canMoveBill}
              onEditPayAmount={handleEditPayAmount}
              onMoveBill={handleMoveBill}
              action={embedded && canMoveBill ? <MarkAllPaidButton payDate={payDate} sourceId={sourceId} embedded /> : undefined}
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
              payDate={payDate}
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
      canMoveBill,
      handleEditPayAmount,
      handleMoveBill,
      embedded,
      assignedExpenseIds,
      handleAssign,
      handleUnassign,
      handleTogglePaid,
      handleOpenLink,
      handleEditAmount,
      t,
    ]
  );

  useEffect(() => {
    if (embedded || buttonInBar.current === canMoveBill) return;
    buttonInBar.current = canMoveBill;
    navigation.setOptions({ headerRight: canMoveBill ? markAllPaidHeaderRight(payDate, sourceId) : undefined });
  }, [embedded, canMoveBill, navigation, payDate, sourceId]);

  return (
    <>
      <LayoutAnimationConfig skipEntering skipExiting={embedded}>
        <FlatList
          data={listData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          CellRendererComponent={AppAnimatedListCell}
          style={listStyle}
          contentContainerStyle={contentStyle}
          renderScrollComponent={renderScrollComponent}
          keyboardShouldPersistTaps="handled"
        />
      </LayoutAnimationConfig>
    </>
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
