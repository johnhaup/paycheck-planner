import { useCallback, useMemo, useState } from "react";
import { View, FlatList, ScrollView, StyleSheet, Linking } from "react-native";
import { useRouter } from "expo-router";
import { format } from "date-fns";
import { useStore } from "@/store";
import { useThemeStore } from "@/stores/themeStore";
import { getPayDates, formatPayDate, formatDisplayDate } from "@/utils/payDates";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { PaycheckCard } from "@/components/paychecks/PaycheckCard";
import { MonthTab } from "@/components/paychecks/MonthTab";
import type { MonthGroup, PaycheckExpense, PaycheckItem } from "@/components/paychecks/types";

const PAY_DATE_COUNT = 12;

function keyExtractor(item: PaycheckItem) {
  return item.key;
}

function getCurrentMonthKey() {
  return format(new Date(), "yyyy-MM");
}

export default function PaychecksScreen() {
  const router = useRouter();
  const colors = useColors();
  const incomeSources = useStore((s) => s.incomeSources);
  const expenses = useStore((s) => s.expenses);
  const assignments = useStore((s) => s.assignments);
  const assignExpense = useStore((s) => s.assignExpense);
  const togglePaid = useStore((s) => s.togglePaid);
  const autoMarkPaid = useThemeStore((s) => s.autoMarkPaidOnLinkTap);
  const [selectedMonthKey, setSelectedMonthKey] = useState(getCurrentMonthKey);

  const handleTogglePaid = useCallback(
    (assignmentId: string, expenseId: string, payDate: string, sourceId: string) => {
      const id = assignmentId || assignExpense(expenseId, payDate, sourceId);
      togglePaid(id);
    },
    [assignExpense, togglePaid]
  );

  const handleLinkTap = useCallback(
    (link: string, assignmentId: string, expenseId: string, payDate: string, sourceId: string) => {
      Linking.openURL(link);
      if (autoMarkPaid) {
        const id = assignmentId || assignExpense(expenseId, payDate, sourceId);
        const assignment = assignments.find((a) => a.id === id);
        if (!assignment?.paid) {
          togglePaid(id);
        }
      }
    },
    [autoMarkPaid, assignExpense, assignments, togglePaid]
  );

  const handlePressPaycheck = useCallback(
    (payDate: string, sourceId: string) => {
      router.push({
        pathname: "/pay-date-detail",
        params: { payDate, sourceId },
      });
    },
    [router]
  );

  const renderPaycheck = useCallback(
    ({ item }: { item: PaycheckItem }) => (
      <PaycheckCard
        item={item}
        onPress={handlePressPaycheck}
        onTogglePaid={handleTogglePaid}
        onLinkTap={handleLinkTap}
      />
    ),
    [handlePressPaycheck, handleTogglePaid, handleLinkTap]
  );

  const months = useMemo(() => {
    const now = new Date();
    const allPaychecks: PaycheckItem[] = [];

    for (const source of incomeSources) {
      const dates = getPayDates(source, now, PAY_DATE_COUNT);
      for (const date of dates) {
        const key = formatPayDate(date);
        const matched = assignments.filter(
          (a) => a.payDate === key && a.employerId === source.id
        );
        const assignedIds = new Set(matched.map((a) => a.expenseId));
        const expenseData: PaycheckExpense[] = matched.map((a) => {
          const expense = expenses.find((e) => e.id === a.expenseId);
          return {
            expenseId: a.expenseId,
            payee: expense?.payee ?? "Unknown",
            amount: expense?.amount ?? 0,
            assignmentId: a.id,
            link: expense?.link,
            paid: a.paid,
          };
        });
        for (const expense of expenses) {
          if (expense.incomeSourceId === source.id && !assignedIds.has(expense.id)) {
            expenseData.push({
              expenseId: expense.id,
              payee: expense.payee,
              amount: expense.amount,
              assignmentId: "",
              link: expense.link,
              paid: undefined,
            });
          }
        }
        const totalExpenses = expenseData.reduce((sum, d) => sum + d.amount, 0);

        allPaychecks.push({
          key: `${source.id}-${key}`,
          title: formatDisplayDate(date),
          payDate: key,
          sourceName: source.name,
          sourceId: source.id,
          payAmount: source.payAmount,
          expenses: expenseData,
          totalExpenses,
          remaining: source.payAmount - totalExpenses,
        });
      }
    }

    allPaychecks.sort(
      (a, b) => new Date(a.payDate).getTime() - new Date(b.payDate).getTime()
    );

    const grouped = new Map<string, MonthGroup>();
    for (const pc of allPaychecks) {
      const date = new Date(pc.payDate + "T00:00:00");
      const monthKey = format(date, "yyyy-MM");
      const monthLabel = format(date, "MMM yyyy");
      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, { key: monthKey, label: monthLabel, paychecks: [] });
      }
      grouped.get(monthKey)!.paychecks.push(pc);
    }

    return Array.from(grouped.values());
  }, [incomeSources, expenses, assignments]);

  const selectedMonthIndex = useMemo(() => {
    const idx = months.findIndex((m) => m.key === selectedMonthKey);
    return idx >= 0 ? idx : 0;
  }, [months, selectedMonthKey]);

  const currentPaychecks = useMemo(
    () => months[selectedMonthIndex]?.paychecks ?? [],
    [months, selectedMonthIndex]
  );

  const containerStyle = useMemo(
    () => [styles.container, { backgroundColor: colors.screenBackground }],
    [colors]
  );

  const emptyStyle = useMemo(
    () => [styles.empty, { backgroundColor: colors.screenBackground }],
    [colors]
  );

  if (incomeSources.length === 0) {
    return (
      <View style={emptyStyle}>
        <View style={styles.emptyCenter}>
          <AppText variant="h2">No income sources yet</AppText>
          <AppText variant="subtext" center style={styles.emptySubtitle}>
            Add an income source in the Income tab to see your paychecks.
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.monthsContent}
        style={styles.monthsBar}
      >
        {months.map((month) => (
          <MonthTab
            key={month.key}
            monthKey={month.key}
            label={month.label}
            selected={month.key === selectedMonthKey}
            onSelect={setSelectedMonthKey}
          />
        ))}
      </ScrollView>
      <FlatList
        data={currentPaychecks}
        keyExtractor={keyExtractor}
        renderItem={renderPaycheck}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  monthsBar: {
    flexGrow: 0,
  },
  monthsContent: {
    paddingHorizontal: MEASUREMENTS.spacing.lg,
    paddingVertical: MEASUREMENTS.spacing.base,
    gap: MEASUREMENTS.spacing.md,
  },
  listContent: {
    padding: MEASUREMENTS.spacing.lg,
    paddingBottom: MEASUREMENTS.spacing.bottom,
  },
  empty: {
    flex: 1,
    paddingHorizontal: MEASUREMENTS.spacing.section,
  },
  emptyCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptySubtitle: {
    marginTop: MEASUREMENTS.spacing.md,
  },
});
