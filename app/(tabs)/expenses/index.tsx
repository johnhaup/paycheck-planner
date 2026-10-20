import { useCallback, useMemo, useState } from "react";
import { View, SectionList, StyleSheet, type SectionListData } from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "@/store";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppFab } from "@/components/AppFab";
import { AppSectionHeader } from "@/components/AppSectionHeader";
import { AppSegmentedControl, type SegmentOption } from "@/components/AppSegmentedControl";
import { ExpenseRow } from "@/components/expenses/ExpenseRow";
import { openPaymentLink } from "@/utils/links";
import { formatMoney } from "@/utils/money";
import {
  buildExpenseSections,
  summarizeExpenses,
  type ExpenseFilter,
  type ExpenseListItem,
  type ExpenseSection,
} from "@/utils/expenseSections";

const FILTER_OPTIONS: SegmentOption<ExpenseFilter>[] = [
  { value: "all", label: "All" },
  { value: "recurring", label: "Recurring" },
  { value: "one-time", label: "One-time" },
];

function keyExtractor(item: ExpenseListItem) {
  return item.expense.id;
}

function renderSectionHeader({
  section,
}: {
  section: SectionListData<ExpenseListItem, ExpenseSection>;
}) {
  return <AppSectionHeader title={section.title} trailing={section.total} />;
}

export default function ExpensesScreen() {
  const router = useRouter();
  const colors = useColors();
  const expenses = useStore((s) => s.expenses);
  const incomeSources = useStore((s) => s.incomeSources);
  const deleteExpense = useStore((s) => s.deleteExpense);
  const [filter, setFilter] = useState<ExpenseFilter>("all");

  const handleAdd = useCallback(() => {
    router.push("/expense-form");
  }, [router]);

  const handleEdit = useCallback(
    (id: string) => {
      router.push({ pathname: "/expense-form", params: { id } });
    },
    [router]
  );

  const renderItem = useCallback(
    ({
      item,
      index,
      section,
    }: {
      item: ExpenseListItem;
      index: number;
      section: SectionListData<ExpenseListItem, ExpenseSection>;
    }) => (
      <ExpenseRow
        expense={item.expense}
        meta={item.meta}
        cadence={item.cadence}
        tintIndex={item.tintIndex}
        isFirst={index === 0}
        isLast={index === section.data.length - 1}
        onEdit={handleEdit}
        onDelete={deleteExpense}
        onOpenLink={openPaymentLink}
      />
    ),
    [handleEdit, deleteExpense]
  );

  const sections = useMemo(
    () => buildExpenseSections(expenses, incomeSources, filter),
    [expenses, incomeSources, filter]
  );

  const summary = useMemo(
    () => summarizeExpenses(expenses, incomeSources),
    [expenses, incomeSources]
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.header}>
        <AppText variant="meta">
          {formatMoney(summary.monthlyTotal)} a month across {summary.recurringCount}{" "}
          {summary.recurringCount === 1 ? "bill" : "bills"}
        </AppText>
        <AppSegmentedControl options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
      </View>
    ),
    [summary, filter]
  );

  const listEmpty = useMemo(
    () => (
      <AppText variant="meta" center style={styles.filterEmpty}>
        Nothing here yet.
      </AppText>
    ),
    []
  );

  const containerStyle = useMemo(
    () => [styles.container, { backgroundColor: colors.screenBackground }],
    [colors]
  );

  return (
    <View style={containerStyle}>
      {expenses.length === 0 ? (
        <View style={styles.empty}>
          <AppText variant="title" center>No expenses yet</AppText>
          <AppText variant="meta" center>
            Add your bills with the + button, then assign them to paychecks.
          </AppText>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          stickySectionHeadersEnabled={false}
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
    paddingHorizontal: MEASUREMENTS.spacing.gutter,
    paddingTop: MEASUREMENTS.spacing.md,
    paddingBottom: MEASUREMENTS.fabSize + MEASUREMENTS.spacing.bottom,
  },
  header: {
    gap: MEASUREMENTS.spacing.base,
  },
  filterEmpty: {
    marginTop: MEASUREMENTS.spacing.section,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.md,
    paddingHorizontal: MEASUREMENTS.spacing.section,
  },
});
