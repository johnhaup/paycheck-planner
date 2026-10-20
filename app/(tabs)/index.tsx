import { useCallback, useMemo, useState } from "react";
import {
  View,
  FlatList,
  ScrollView,
  Pressable,
  StyleSheet,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { format } from "date-fns";
import { useStore } from "../../src/store";
import { useThemeStore } from "../../src/stores/themeStore";
import { getPayDates, formatPayDate, formatDisplayDate } from "../../src/utils/payDates";
import { useColors } from "../../src/hooks/useColors";
import { MEASUREMENTS } from "../../src/constants/measurements";
import { AppText } from "../../src/components/AppText";

const PAY_DATE_COUNT = 12;

interface PaycheckItem {
  key: string;
  title: string;
  payDate: string;
  sourceName: string;
  sourceId: string;
  payAmount: number;
  expenses: { expenseId: string; payee: string; amount: number; assignmentId: string; link?: string; paid?: boolean }[];
  totalExpenses: number;
  remaining: number;
}

interface MonthGroup {
  key: string;
  label: string;
  paychecks: PaycheckItem[];
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
  const currentMonthKey = useMemo(() => format(new Date(), "yyyy-MM"), []);
  const [selectedMonthKey, setSelectedMonthKey] = useState(currentMonthKey);

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
        const expenseData = matched.map((a) => {
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

  const selectedMonthIndex = useMemo(() => {
    const idx = months.findIndex((m) => m.key === selectedMonthKey);
    return idx >= 0 ? idx : 0;
  }, [months, selectedMonthKey]);

  const handleSelectMonth = useCallback((key: string) => {
    setSelectedMonthKey(key);
  }, []);

  const currentPaychecks = useMemo(
    () => months[selectedMonthIndex]?.paychecks ?? [],
    [months, selectedMonthIndex]
  );

  const renderPaycheck = useCallback(
    ({ item }: { item: PaycheckItem }) => (
      <Pressable
        onPress={() => handlePressPaycheck(item.payDate, item.sourceId)}
        style={[styles.card, { backgroundColor: colors.cardBackground }]}
      >
        <View style={styles.cardHeader}>
          <AppText variant="h3">{item.title}</AppText>
          <AppText variant="caption">{item.sourceName}</AppText>
        </View>
        <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />
        {item.expenses.length > 0 ? (
          item.expenses.map((b) => (
            <View key={b.assignmentId} style={styles.expenseRow}>
              <Pressable
                onPress={() => handleTogglePaid(b.assignmentId, b.expenseId, item.payDate, item.sourceId)}
                hitSlop={MEASUREMENTS.hitSlop}
              >
                <Ionicons
                  name={b.paid ? "checkbox" : "square-outline"}
                  size={22}
                  color={b.paid ? colors.primary : colors.textMuted}
                  style={styles.checkbox}
                />
              </Pressable>
              <Pressable
                style={styles.expenseContent}
                onPress={b.link ? () => handleLinkTap(b.link!, b.assignmentId, b.expenseId, item.payDate, item.sourceId) : undefined}
              >
                <View style={styles.expensePayeeRow}>
                  <AppText
                    variant="regular"
                    style={b.paid ? { textDecorationLine: "line-through", opacity: 0.4 } : undefined}
                  >
                    {b.payee}
                  </AppText>
                  {b.link ? (
                    <Ionicons
                      name="open-outline"
                      size={18}
                      color={b.paid ? colors.textMuted : colors.textDefault}
                      style={styles.linkIcon}
                    />
                  ) : null}
                </View>
                <AppText
                  variant="subtext"
                  style={b.paid ? { textDecorationLine: "line-through", opacity: 0.4 } : undefined}
                >
                  ${b.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </AppText>
              </Pressable>
            </View>
          ))
        ) : (
          <AppText variant="subtext" color="textMuted" center style={styles.noExpenses}>
            Tap to assign expenses
          </AppText>
        )}
        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <AppText variant="subtext">
            ${item.payAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </AppText>
          <AppText
            variant="regular-bold"
            style={{ color: item.remaining < 0 ? colors.destructive : colors.primary }}
          >
            ${item.remaining.toLocaleString("en-US", { minimumFractionDigits: 2 })} left
          </AppText>
        </View>
      </Pressable>
    ),
    [handlePressPaycheck, handleTogglePaid, handleLinkTap, colors]
  );

  if (incomeSources.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.screenBackground }]}>
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
    <View style={[styles.container, { backgroundColor: colors.screenBackground }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.monthsContent}
        style={styles.monthsBar}
      >
        {months.map((month) => {
          const isSelected = month.key === selectedMonthKey;
          return (
            <Pressable
              key={month.key}
              onPress={() => handleSelectMonth(month.key)}
              style={[
                styles.monthTab,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: isSelected ? colors.primary : colors.cardBackground,
                },
              ]}
            >
              <AppText
                variant="regular"
                style={{ color: isSelected ? colors.textDefault : colors.textMuted }}
              >
                {month.label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
      <FlatList
        data={currentPaychecks}
        keyExtractor={(item) => item.key}
        renderItem={renderPaycheck}
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
  monthTab: {
    paddingHorizontal: MEASUREMENTS.spacing.lg,
    paddingVertical: MEASUREMENTS.spacing.md,
    borderRadius: MEASUREMENTS.radius.md,
    borderWidth: 2,
  },
  listContent: {
    padding: MEASUREMENTS.spacing.lg,
    paddingBottom: MEASUREMENTS.spacing.bottom,
  },
  card: {
    borderRadius: MEASUREMENTS.radius.xl,
    marginBottom: MEASUREMENTS.spacing.base,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: MEASUREMENTS.spacing.lg,
    paddingTop: MEASUREMENTS.spacing.base,
    paddingBottom: MEASUREMENTS.spacing.md,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: MEASUREMENTS.spacing.lg,
  },
  expenseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: MEASUREMENTS.spacing.lg,
    paddingVertical: MEASUREMENTS.spacing.md,
  },
  checkbox: {
    marginRight: MEASUREMENTS.spacing.md,
  },
  expenseContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expensePayeeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  linkIcon: {
    marginLeft: MEASUREMENTS.spacing.sm + 2,
  },
  noExpenses: {
    paddingVertical: MEASUREMENTS.spacing.base,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: MEASUREMENTS.spacing.lg,
    paddingVertical: MEASUREMENTS.spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
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
