import { useCallback, useMemo, useState } from "react";
import {
  ActionSheetIOS,
  View,
  Pressable,
  SectionList,
  StyleSheet,
  type NativeSyntheticEvent,
  type SectionListData,
  type TextInputFocusEventData,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
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
import { withUndo } from "@/utils/undo";
import {
  buildExpenseSections,
  summarizeExpenses,
  type ExpenseFilter,
  type ExpenseSort,
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
  const assignments = useStore((s) => s.assignments);
  const deleteExpense = useStore((s) => s.deleteExpense);
  const [filter, setFilter] = useState<ExpenseFilter>("all");
  const [sort, setSort] = useState<ExpenseSort>("default");
  const [query, setQuery] = useState("");

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
    (id: string) => {
      const payee = expenses.find((e) => e.id === id)?.payee ?? "";
      withUndo(t("toasts.expenseDeleted", { payee }), () => deleteExpense(id));
    },
    [expenses, deleteExpense, t]
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
        goalProgress={item.goalProgress}
        isFirst={index === 0}
        isLast={index === section.data.length - 1}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onOpenLink={openPaymentLink}
      />
    ),
    [handleEdit, handleDelete]
  );

  const handleSearch = useCallback((e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setQuery(e.nativeEvent.text);
  }, []);

  const handleSortPress = useCallback(() => {
    const sorts: ExpenseSort[] = ["default", "amount", "name"];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: t("expenses.sort.title"),
        options: [
          t("expenses.sort.default"),
          t("expenses.sort.amount"),
          t("expenses.sort.name"),
          t("common.cancel"),
        ],
        cancelButtonIndex: sorts.length,
      },
      (index) => {
        const next = sorts[index];
        if (next) {
          setSort(next);
        }
      }
    );
  }, [t]);

  const renderSortButton = useCallback(
    () => (
      <Pressable
        onPress={handleSortPress}
        hitSlop={MEASUREMENTS.hitSlop}
        accessibilityRole="button"
        accessibilityLabel={t("expenses.sort.title")}
      >
        <Ionicons name="swap-vertical" size={22} color={colors.textDefault} />
      </Pressable>
    ),
    [handleSortPress, colors, t]
  );

  const screenOptions = useMemo(
    () => ({
      headerRight: expenses.length > 0 ? renderSortButton : undefined,
      headerSearchBarOptions:
        expenses.length > 0
          ? { placeholder: t("expenses.searchPlaceholder"), onChangeText: handleSearch }
          : undefined,
    }),
    [expenses.length, renderSortButton, handleSearch, t]
  );

  const visibleExpenses = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return needle ? expenses.filter((e) => e.payee.toLocaleLowerCase().includes(needle)) : expenses;
  }, [expenses, query]);

  const filterOptions = useMemo<SegmentOption<ExpenseFilter>[]>(
    () => [
      { value: "all", label: t("expenses.filters.all") },
      { value: "recurring", label: t("expenses.filters.recurring") },
      { value: "one-time", label: t("expenses.filters.oneTime") },
    ],
    [t]
  );

  const sections = useMemo(
    () => buildExpenseSections(visibleExpenses, incomeSources, assignments, filter, sort, formatMoney),
    // t changes with the language, which changes the section labels
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleExpenses, incomeSources, assignments, filter, sort, formatMoney, t]
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
        {query.trim() ? t("expenses.noMatches", { query: query.trim() }) : t("expenses.nothingHere")}
      </AppText>
    ),
    [query, t]
  );

  const containerStyle = useMemo(
    () => [styles.container, { backgroundColor: colors.screenBackground }],
    [colors]
  );

  return (
    <View style={containerStyle}>
      <Stack.Screen options={screenOptions} />
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
