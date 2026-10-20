import { useCallback, useMemo, useState } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { format } from "date-fns";
import { useStore } from "@/store";
import { useThemeStore } from "@/stores/themeStore";
import { useColors } from "@/hooks/useColors";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppHeroAmount } from "@/components/AppHeroAmount";
import { AppSectionHeader } from "@/components/AppSectionHeader";
import { MonthBarChart } from "@/components/paychecks/MonthBarChart";
import { PaycheckCard } from "@/components/paychecks/PaycheckCard";
import { openPaymentLink } from "@/utils/links";
import { buildMonthGroups } from "@/utils/paycheckMonths";
import type { PaycheckItem } from "@/components/paychecks/types";

function keyExtractor(item: PaycheckItem) {
  return item.key;
}

function getCurrentMonthKey() {
  return format(new Date(), "yyyy-MM");
}

export default function PaychecksScreen() {
  const router = useRouter();
  const colors = useColors();
  const { format: formatMoney } = useMoneyFormat();
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
      openPaymentLink(link);
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

  const months = useMemo(
    () => buildMonthGroups(incomeSources, expenses, assignments, new Date()),
    [incomeSources, expenses, assignments]
  );

  const selectedMonth = useMemo(
    () => months.find((m) => m.key === selectedMonthKey) ?? months[0],
    [months, selectedMonthKey]
  );

  const paychecks = useMemo(() => selectedMonth?.paychecks ?? [], [selectedMonth]);

  const listHeader = useMemo(
    () =>
      selectedMonth ? (
        <View>
          <AppText variant="meta">{selectedMonth.longLabel} · left after bills</AppText>
          <AppHeroAmount amount={selectedMonth.remaining} />
          <AppText variant="meta" style={styles.heroMeta}>
            {formatMoney(selectedMonth.income)} in · {formatMoney(selectedMonth.assigned)} assigned
          </AppText>
          <View style={styles.chart}>
            <MonthBarChart
              months={months}
              selectedKey={selectedMonth.key}
              onSelect={setSelectedMonthKey}
            />
          </View>
          <AppSectionHeader
            title={`${selectedMonth.longLabel} paychecks`}
            trailing={String(selectedMonth.paychecks.length)}
          />
        </View>
      ) : null,
    [selectedMonth, months, formatMoney]
  );

  const containerStyle = useMemo(
    () => [styles.container, { backgroundColor: colors.screenBackground }],
    [colors]
  );

  // Keep one root View across the empty and list states; swapping the root
  // element after the store rehydrates drops the native large title.
  return (
    <View style={containerStyle}>
      {incomeSources.length === 0 ? (
        <View style={styles.empty}>
          <AppText variant="title" center>No income sources yet</AppText>
          <AppText variant="meta" center>
            Add one in the Income tab to see your upcoming paychecks.
          </AppText>
        </View>
      ) : (
        <FlatList
          data={paychecks}
          keyExtractor={keyExtractor}
          renderItem={renderPaycheck}
          ListHeaderComponent={listHeader}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    paddingBottom: MEASUREMENTS.spacing.bottom,
  },
  heroMeta: {
    marginTop: MEASUREMENTS.spacing.xs,
  },
  chart: {
    marginTop: MEASUREMENTS.spacing.xl,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.md,
    paddingHorizontal: MEASUREMENTS.spacing.section,
  },
});
