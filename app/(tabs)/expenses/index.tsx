import { useCallback, useMemo, useState, useRef } from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  View,
  Pressable,
  SectionList,
  StyleSheet,
  type SectionListData,
  type NativeSyntheticEvent,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useStore } from "@/store";
import { useColors } from "@/hooks/useColors";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useT } from "@/hooks/useLocale";
import { MEASUREMENTS } from "@/constants/measurements";
import { DIM_ON_PRESS } from "@/constants/press";
import { useGutters } from "@/hooks/useGutters";
import { useColumns } from "@/hooks/useColumns";
import { COLUMN_GAP } from "@/constants/layout";
import { LARGE_TITLE_LIST, LARGE_TITLE_LIST_CONTENT } from "@/constants/direction";
import { AppText } from "@/components/AppText";
import { AppCountUpText } from "@/components/AppCountUpText";
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
import { LayoutAnimationConfig } from "react-native-reanimated";
import {
  AppAnimatedListCell,
  ListCellAnimationContext,
  useListSwap,
} from "@/components/AppAnimatedListCell";
import { useScrollKeptOnResize } from "@/hooks/useScrollKeptOnResize";

/**
 * One item of the list: a bill, or on a regular-width screen (iPhone Duo or Pixel 9 Pro Fold unfolded)
 * the whole list as two columns of sections, each section's header and total above its own card.
 */
type ExpenseLine = { kind: "bill"; item: ExpenseListItem } | { kind: "columns"; columns: ExpenseSection[][] };
type LineSection = Omit<ExpenseSection, "data"> & { data: ExpenseLine[] };

function keyExtractor(line: ExpenseLine) {
  return line.kind === "bill" ? line.item.expense.id : "columns";
}

function renderSectionHeader({ section }: { section: SectionListData<ExpenseLine, LineSection> }) {
  // The wide layout draws each header inside its column
  return section.title ? <AppSectionHeader title={section.title} trailing={section.total} /> : null;
}

/** Sections stay whole and in order; each goes to the column that is shorter so far */
function splitIntoColumns(sections: ExpenseSection[]): ExpenseSection[][] {
  const columns: ExpenseSection[][] = [[], []];
  const heights = [0, 0];
  for (const section of sections) {
    const at = heights[1] < heights[0] ? 1 : 0;
    columns[at].push(section);
    // A header weighs about one row
    heights[at] += section.data.length + 1;
  }
  return columns;
}

export default function ExpensesScreen() {
  const router = useRouter();
  const colors = useColors();
  const scrollRef = useRef<SectionList<ExpenseLine, LineSection>>(null);
  const keptScroll = useScrollKeptOnResize(scrollRef);
  const { format: formatMoney } = useMoneyFormat();
  const t = useT();
  const expenses = useStore((s) => s.expenses);
  const incomeSources = useStore((s) => s.incomeSources);
  const assignments = useStore((s) => s.assignments);
  const deleteExpense = useStore((s) => s.deleteExpense);
  const hasExpenses = expenses.length > 0;
  const [filter, setFilter] = useState<ExpenseFilter>("all");
  const [sort, setSort] = useState<ExpenseSort>("default");
  const [query, setQuery] = useState("");
  // Filter, sort and search swap the rows; only adds and deletes animate them
  const { animated, swap } = useListSwap();

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

  const columns = useColumns();
  const startColumnStyle = useMemo(() => (columns ? { width: columns.startWidth } : undefined), [columns]);

  const renderBill = useCallback(
    (item: ExpenseListItem, index: number, count: number) => (
      <ExpenseRow
        expense={item.expense}
        meta={item.meta}
        cadence={item.cadence}
        tintIndex={item.tintIndex}
        goalProgress={item.goalProgress}
        isFirst={index === 0}
        isLast={index === count - 1}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onOpenLink={openPaymentLink}
      />
    ),
    [handleEdit, handleDelete]
  );

  const renderItem = useCallback(
    ({
      item: line,
      index,
      section,
    }: {
      item: ExpenseLine;
      index: number;
      section: SectionListData<ExpenseLine, LineSection>;
    }) => {
      if (line.kind === "bill") return renderBill(line.item, index, section.data.length);
      return (
        <View style={styles.line}>
          {line.columns.map((column, i) => (
            <View
              key={column[0]?.key ?? i}
              style={[i === 0 ? startColumnStyle : styles.endColumn, i === 0 ? styles.startColumn : null]}
            >
              {column.map((s) => (
                <View key={s.key}>
                  <AppSectionHeader title={s.title} trailing={s.total} />
                  {s.data.map((item, k) => (
                    <View key={item.expense.id}>{renderBill(item, k, s.data.length)}</View>
                  ))}
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    },
    [renderBill, startColumnStyle]
  );

  const handleSearch = useCallback(
    (e: NativeSyntheticEvent<{ text: string }>) => {
      const text = e.nativeEvent.text;
      swap(() => setQuery(text));
    },
    [swap]
  );

  const handleFilterChange = useCallback(
    (next: ExpenseFilter) => {
      swap(() => setFilter(next));
    },
    [swap]
  );

  const applySort = useCallback(
    (next: ExpenseSort) => {
      swap(() => setSort(next));
    },
    [swap]
  );

  const handleSortPress = useCallback(() => {
    const sorts: ExpenseSort[] = ["default", "amount", "name"];
    if (Platform.OS !== "ios") {
      // ActionSheetIOS throws on Android. An Android alert holds three buttons:
      // the two orders not in use, and Cancel.
      Alert.alert(
        t("expenses.sort.title"),
        undefined,
        [
          ...sorts
            .filter((s) => s !== sort)
            .map((s) => ({ text: t(`expenses.sort.${s}`), onPress: () => applySort(s) })),
          { text: t("common.cancel"), style: "cancel" as const },
        ],
        { cancelable: true }
      );
      return;
    }
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
          applySort(next);
        }
      }
    );
  }, [t, sort, applySort]);

  const renderSortButton = useCallback(
    () => (
      <Pressable
        style={DIM_ON_PRESS}
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
      headerRight: hasExpenses ? renderSortButton : undefined,
      headerSearchBarOptions: hasExpenses
        ? { placeholder: t("expenses.searchPlaceholder"), onChangeText: handleSearch }
        : undefined,
    }),
    [hasExpenses, renderSortButton, handleSearch, t]
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

  const wide = columns !== undefined;
  const sections = useMemo(
    () => {
      const built = buildExpenseSections(visibleExpenses, incomeSources, assignments, filter, sort, formatMoney);
      if (wide) {
        if (built.length === 0) return [];
        const columns = splitIntoColumns(built);
        return [{ key: "columns", title: "", total: "", data: [{ kind: "columns" as const, columns }] }];
      }
      return built.map(
        (section): LineSection => ({
          ...section,
          data: section.data.map((item) => ({ kind: "bill" as const, item })),
        })
      );
    },
    // t changes with the language, which changes the section labels
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleExpenses, incomeSources, assignments, filter, sort, formatMoney, wide, t]
  );

  const summary = useMemo(
    () => summarizeExpenses(expenses, incomeSources),
    [expenses, incomeSources]
  );

  const summaryAmounts = useMemo(() => [summary.monthlyTotal], [summary.monthlyTotal]);
  const renderSummary = useCallback(
    (amounts: readonly number[]) =>
      t("expenses.monthlySummary", { amount: formatMoney(amounts[0]), count: summary.recurringCount }),
    [t, formatMoney, summary.recurringCount]
  );

  const listHeader = useMemo(
    () => (
      <View style={startColumnStyle ? styles.headerWide : styles.header}>
        <AppCountUpText variant="meta" style={startColumnStyle} amounts={summaryAmounts} render={renderSummary} />
        <View style={startColumnStyle ? styles.endColumn : undefined}>
          <AppSegmentedControl options={filterOptions} value={filter} onChange={handleFilterChange} />
        </View>
      </View>
    ),
    [summaryAmounts, renderSummary, filter, filterOptions, handleFilterChange, startColumnStyle]
  );

  const listEmpty = useMemo(
    () =>
      hasExpenses ? (
        <AppText variant="meta" center style={styles.filterEmpty}>
          {query.trim() ? t("expenses.noMatches", { query: query.trim() }) : t("expenses.nothingHere")}
        </AppText>
      ) : (
        <AppEmptyState
          icon="receipt-outline"
          title={t("expenses.emptyTitle")}
          body={t("expenses.emptyBody")}
          actionLabel={t("expenses.addExpense")}
          onAction={handleAdd}
        />
      ),
    [hasExpenses, query, handleAdd, t]
  );

  const gutters = useGutters();
  const emptyGutters = useGutters(0);
  const contentStyle = useMemo(
    () =>
      hasExpenses
        ? [styles.listContent, gutters, LARGE_TITLE_LIST_CONTENT]
        : [styles.emptyContent, emptyGutters, LARGE_TITLE_LIST_CONTENT],
    [hasExpenses, gutters, emptyGutters]
  );

  // The list is the screen's root view so iOS collapses the large title on scroll
  return (
    <>
      <Stack.Screen options={screenOptions} />
      <ListCellAnimationContext.Provider value={animated}>
        <LayoutAnimationConfig skipEntering>
          <SectionList
            ref={scrollRef}
            {...keptScroll}
            style={LARGE_TITLE_LIST}
            sections={sections}
            CellRendererComponent={AppAnimatedListCell}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            ListHeaderComponent={hasExpenses ? listHeader : undefined}
            ListEmptyComponent={listEmpty}
            stickySectionHeadersEnabled={false}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={contentStyle}
          />
        </LayoutAnimationConfig>
      </ListCellAnimationContext.Provider>
      <AppFab accessibilityLabel={t("expenses.addExpense")} onPress={handleAdd} />
    </>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingTop: MEASUREMENTS.spacing.md,
    paddingBottom: MEASUREMENTS.fabSize + MEASUREMENTS.spacing.bottom,
  },
  emptyContent: {
    flexGrow: 1,
    paddingBottom: MEASUREMENTS.fabSize + MEASUREMENTS.spacing.bottom,
  },
  header: {
    gap: MEASUREMENTS.spacing.base,
  },
  // Regular width: the summary in the first column, the filter in the second, clear of the middle
  headerWide: {
    flexDirection: "row",
    alignItems: "center",
    gap: COLUMN_GAP,
  },
  line: {
    flexDirection: "row",
    gap: COLUMN_GAP,
  },
  endColumn: {
    flex: 1,
  },
  startColumn: {
    flexGrow: 0,
  },
  filterEmpty: {
    marginTop: MEASUREMENTS.spacing.section,
  },
});
