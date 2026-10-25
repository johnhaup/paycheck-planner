import { useCallback, useMemo, useState } from "react";
import { View, SectionList, StyleSheet, type SectionListData } from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "@/store";
import { useColors } from "@/hooks/useColors";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useT } from "@/hooks/useLocale";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppEmptyState } from "@/components/AppEmptyState";
import { AppFab } from "@/components/AppFab";
import { AppSectionHeader } from "@/components/AppSectionHeader";
import { AppSegmentedControl, type SegmentOption } from "@/components/AppSegmentedControl";
import { ExpenseRow } from "@/components/expenses/ExpenseRow";
import { openPaymentLink } from "@/utils/links";
import {
  buildExpenseSections,
  summarizeExpenses,
  type ExpenseFilter,
  type ExpenseListItem,
  type ExpenseSection,
} from "@/utils/expenseSections";

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
  const { format: formatMoney } = useMoneyFormat();
  const t = useT();
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

  const filterOptions = useMemo<SegmentOption<ExpenseFilter>[]>(
    () => [
      { value: "all", label: t("expenses.filters.all") },
      { value: "recurring", label: t("expenses.filters.recurring") },
      { value: "one-time", label: t("expenses.filters.oneTime") },
    ],
    [t]
  );

  const sections = useMemo(
    () => buildExpenseSections(expenses, incomeSources, filter, formatMoney),
    // t changes with the language, which changes the section labels
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expenses, incomeSources, filter, formatMoney, t]
  );

  const summary = useMemo(
    () => summarizeExpenses(expenses, incomeSources),
    [expenses, incomeSources]
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.header}>
        <AppText variant="meta">
          {t("expenses.monthlySummary", {
            amount: formatMoney(summary.monthlyTotal),
            count: summary.recurringCount,
          })}
        </AppText>
        <AppSegmentedControl options={filterOptions} value={filter} onChange={setFilter} />
      </View>
    ),
    [summary, filter, filterOptions, formatMoney, t]
  );

  const listEmpty = useMemo(
    () => (
      <AppText variant="meta" center style={styles.filterEmpty}>
        {t("expenses.nothingHere")}
      </AppText>
    ),
    [t]
  );

  const containerStyle = useMemo(
    () => [styles.container, { backgroundColor: colors.screenBackground }],
    [colors]
  );

  return (
    <View style={containerStyle}>
      {expenses.length === 0 ? (
        <AppEmptyState
          icon="receipt-outline"
          title={t("expenses.emptyTitle")}
          body={t("expenses.emptyBody")}
          actionLabel={t("expenses.addExpense")}
          onAction={handleAdd}
        />
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
      <AppFab accessibilityLabel={t("expenses.addExpense")} onPress={handleAdd} />
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
});
