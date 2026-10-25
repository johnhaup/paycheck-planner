import { useCallback, useMemo, useState } from "react";
import { View, FlatList, Pressable, StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import { format } from "date-fns";
import { useStore } from "@/store";
import { useThemeStore } from "@/stores/themeStore";
import { useColors } from "@/hooks/useColors";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useT } from "@/hooks/useLocale";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppEmptyState } from "@/components/AppEmptyState";
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
  const t = useT();
  const incomeSources = useStore((s) => s.incomeSources);
  const expenses = useStore((s) => s.expenses);
  const assignments = useStore((s) => s.assignments);
  const paycheckOverrides = useStore((s) => s.paycheckOverrides);
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

  const handleEditAmount = useCallback(
    (expenseId: string, payDate: string, sourceId: string) => {
      router.push({
        pathname: "/expense-amount",
        params: { expenseId, payDate, sourceId },
      });
    },
    [router]
  );

  const handleEditPayAmount = useCallback(
    (payDate: string, sourceId: string) => {
      router.push({
        pathname: "/paycheck-amount",
        params: { payDate, sourceId },
      });
    },
    [router]
  );

  const handleMoveBill = useCallback(
    (payDate: string, sourceId: string) => {
      router.push({
        pathname: "/move-bill",
        params: { payDate, sourceId },
      });
    },
    [router]
  );

  const handleAddIncome = useCallback(() => {
    router.push("/income-form");
  }, [router]);

  const handleGoToToday = useCallback(() => {
    setSelectedMonthKey(getCurrentMonthKey());
  }, []);

  const renderTodayButton = useCallback(
    () => (
      <Pressable
        onPress={handleGoToToday}
        hitSlop={MEASUREMENTS.hitSlop}
        accessibilityRole="button"
        accessibilityLabel={t("paychecks.goToThisMonth")}
      >
        <AppText variant="bodyStrong" color="primaryText">{t("paychecks.today")}</AppText>
      </Pressable>
    ),
    [handleGoToToday, t]
  );

  const renderPaycheck = useCallback(
    ({ item }: { item: PaycheckItem }) => (
      <PaycheckCard
        item={item}
        onPress={handlePressPaycheck}
        onTogglePaid={handleTogglePaid}
        onLinkTap={handleLinkTap}
        onEditAmount={handleEditAmount}
        onEditPayAmount={handleEditPayAmount}
        onMoveBill={handleMoveBill}
      />
    ),
    [
      handlePressPaycheck,
      handleTogglePaid,
      handleLinkTap,
      handleEditAmount,
      handleEditPayAmount,
      handleMoveBill,
    ]
  );

  const months = useMemo(
    () => buildMonthGroups(incomeSources, expenses, assignments, paycheckOverrides, new Date()),
    // t changes with the language, which changes the month labels
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [incomeSources, expenses, assignments, paycheckOverrides, t]
  );

  const selectedMonth = useMemo(
    () => months.find((m) => m.key === selectedMonthKey) ?? months[0],
    [months, selectedMonthKey]
  );

  // The current month can drop out of the list once its last paycheck passes,
  // so "today" is whichever month comes first.
  const isAwayFromToday = !!selectedMonth && selectedMonth.key !== months[0]?.key;

  const screenOptions = useMemo(
    () => ({ headerLeft: isAwayFromToday ? renderTodayButton : undefined }),
    [isAwayFromToday, renderTodayButton]
  );

  const paychecks = useMemo(() => selectedMonth?.paychecks ?? [], [selectedMonth]);

  const currentMonthKey = getCurrentMonthKey();

  const listHeader = useMemo(
    () =>
      selectedMonth ? (
        <View>
          <AppText variant="meta">{t("paychecks.leftAfterBills", { month: selectedMonth.longLabel })}</AppText>
          <AppHeroAmount amount={selectedMonth.remaining} />
          <AppText variant="meta" style={styles.heroMeta}>
            {t("paychecks.heroMeta", {
              income: formatMoney(selectedMonth.income),
              assigned: formatMoney(selectedMonth.assigned),
            })}
          </AppText>
          <View style={styles.chart}>
            <MonthBarChart
              months={months}
              selectedKey={selectedMonth.key}
              currentKey={currentMonthKey}
              onSelect={setSelectedMonthKey}
            />
          </View>
          <AppSectionHeader
            title={t("paychecks.monthPaychecks", { month: selectedMonth.longLabel })}
            trailing={String(selectedMonth.paychecks.length)}
          />
        </View>
      ) : null,
    [selectedMonth, months, currentMonthKey, formatMoney, t]
  );

  const containerStyle = useMemo(
    () => [styles.container, { backgroundColor: colors.screenBackground }],
    [colors]
  );

  // Keep one root View across the empty and list states; swapping the root
  // element after the store rehydrates drops the native large title.
  return (
    <View style={containerStyle}>
      <Stack.Screen options={screenOptions} />
      {incomeSources.length === 0 ? (
        <AppEmptyState
          icon="wallet-outline"
          title={t("paychecks.emptyTitle")}
          body={t("paychecks.emptyBody")}
          actionLabel={t("paychecks.emptyAction")}
          onAction={handleAddIncome}
        />
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
    marginHorizontal: -MEASUREMENTS.spacing.gutter,
  },
});
