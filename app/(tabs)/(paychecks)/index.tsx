import { useCallback, useMemo, useState } from "react";
import { View, FlatList, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { format } from "date-fns";
import Ionicons from "@expo/vector-icons/Ionicons";
import { toast } from "sonner-native";
import { useStore } from "@/store";
import { useColors } from "@/hooks/useColors";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useT } from "@/hooks/useLocale";
import { usePaycheckCardRenderer } from "@/hooks/usePaycheckCardRenderer";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppHeroAmount } from "@/components/AppHeroAmount";
import { AppSectionHeader } from "@/components/AppSectionHeader";
import { MonthBarChart } from "@/components/paychecks/MonthBarChart";
import { Welcome } from "@/components/paychecks/Welcome";
import { buildMonthGroups } from "@/utils/paycheckMonths";
import { formatShortDate } from "@/utils/dates";
import { buildDemoData } from "@/utils/demoData";
import type { MonthGroup, PaycheckItem } from "@/components/paychecks/types";

const TODAY_ICON_SIZE = 22;

function keyExtractor(item: PaycheckItem) {
  return item.key;
}

/** The first short paycheck outside the month on screen; the chart's red bar is easy to miss. */
function findShortElsewhere(months: MonthGroup[], selectedKey: string | undefined) {
  for (const month of months) {
    if (month.key === selectedKey) continue;
    const paycheck = month.paychecks.find((p) => p.remaining < 0);
    if (paycheck) return { monthKey: month.key, paycheck };
  }
  return undefined;
}

function getCurrentMonthKey() {
  return format(new Date(), "yyyy-MM");
}

export default function PaychecksScreen() {
  const router = useRouter();
  const colors = useColors();
  const t = useT();
  const hasIncome = useStore((s) => s.incomeSources.length > 0);

  const handleAddIncome = useCallback(() => {
    router.push("/income-form");
  }, [router]);

  const handleTrySample = useCallback(() => {
    useStore.setState({ ...buildDemoData(new Date()), paycheckOverrides: [] });
    toast(t("toasts.sampleLoaded"));
  }, [t]);

  const containerStyle = useMemo(
    () => [styles.container, { backgroundColor: colors.screenBackground }],
    [colors]
  );

  // Keep one root View across the empty and list states; swapping the root
  // element after the store rehydrates drops the native large title.
  return (
    <View style={containerStyle}>
      {hasIncome ? (
        <PaycheckMonths />
      ) : (
        <Welcome onAddIncome={handleAddIncome} onTrySample={handleTrySample} />
      )}
    </View>
  );
}

/**
 * The month chart and the selected month's paychecks. Mounted only while there is
 * income, so the selected month starts over at this month after Erase all data.
 */
function PaycheckMonths() {
  const router = useRouter();
  const colors = useColors();
  const { format: formatMoney } = useMoneyFormat();
  const t = useT();
  const incomeSources = useStore((s) => s.incomeSources);
  const expenses = useStore((s) => s.expenses);
  const assignments = useStore((s) => s.assignments);
  const paycheckOverrides = useStore((s) => s.paycheckOverrides);
  const [selectedMonthKey, setSelectedMonthKey] = useState(getCurrentMonthKey);
  const renderPaycheck = usePaycheckCardRenderer();

  const handleOpenHistory = useCallback(() => {
    router.push("/history");
  }, [router]);

  const handleGoToToday = useCallback(() => {
    setSelectedMonthKey(getCurrentMonthKey());
  }, []);

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

  const paychecks = useMemo(() => selectedMonth?.paychecks ?? [], [selectedMonth]);

  const currentMonthKey = getCurrentMonthKey();

  const shortElsewhere = useMemo(
    () => findShortElsewhere(months, selectedMonth?.key),
    [months, selectedMonth]
  );

  const handleShowShort = useCallback(() => {
    if (shortElsewhere) {
      setSelectedMonthKey(shortElsewhere.monthKey);
    }
  }, [shortElsewhere]);

  const listHeader = useMemo(
    () =>
      selectedMonth ? (
        <View>
          <View style={styles.heroLabelRow}>
            <AppText variant="meta" style={styles.heroLabel}>
              {t("paychecks.leftAfterBills", { month: selectedMonth.longLabel })}
            </AppText>
            {isAwayFromToday ? (
              <Pressable
                onPress={handleGoToToday}
                hitSlop={MEASUREMENTS.hitSlop}
                accessibilityRole="button"
                accessibilityLabel={t("paychecks.goToThisMonth")}
              >
                <Ionicons name="today-outline" size={TODAY_ICON_SIZE} color={colors.primaryText} />
              </Pressable>
            ) : null}
          </View>
          <AppHeroAmount amount={selectedMonth.remaining} />
          <AppText variant="meta" style={styles.heroMeta}>
            {t("paychecks.heroMeta", {
              income: formatMoney(selectedMonth.income),
              assigned: formatMoney(selectedMonth.assigned),
            })}
          </AppText>
          {shortElsewhere ? (
            <Pressable style={styles.shortRow} onPress={handleShowShort} accessibilityRole="button">
              <Ionicons name="alert-circle" size={16} color={colors.destructive} />
              <AppText variant="meta" color="destructive" style={styles.shortText} numberOfLines={2}>
                {t("paychecks.shortAhead", {
                  date: formatShortDate(shortElsewhere.paycheck.date),
                  source: shortElsewhere.paycheck.sourceName,
                  amount: formatMoney(-shortElsewhere.paycheck.remaining),
                })}
              </AppText>
              <Ionicons name="chevron-forward" size={16} color={colors.destructive} />
            </Pressable>
          ) : null}
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
      ) : undefined,
    [
      selectedMonth,
      months,
      currentMonthKey,
      isAwayFromToday,
      handleGoToToday,
      shortElsewhere,
      handleShowShort,
      colors,
      formatMoney,
      t,
    ]
  );

  const listFooter = useMemo(
    () => (
      <Pressable
        style={styles.historyLink}
        onPress={handleOpenHistory}
        accessibilityRole="button"
        accessibilityLabel={t("paychecks.pastPaychecks")}
      >
        <AppText variant="bodyStrong" color="primaryText">{t("paychecks.pastPaychecks")}</AppText>
        <Ionicons name="chevron-forward" size={16} color={colors.primaryText} />
      </Pressable>
    ),
    [handleOpenHistory, colors, t]
  );

  return (
    <FlatList
      data={paychecks}
      keyExtractor={keyExtractor}
      renderItem={renderPaycheck}
      ListHeaderComponent={listHeader}
      ListFooterComponent={listFooter}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
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
  heroLabelRow: {
    // Reserve the icon's height so the hero does not jump when it appears
    minHeight: TODAY_ICON_SIZE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: MEASUREMENTS.spacing.md,
  },
  heroLabel: {
    flexShrink: 1,
  },
  heroMeta: {
    marginTop: MEASUREMENTS.spacing.xs,
  },
  shortRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.sm + 2,
    marginTop: MEASUREMENTS.spacing.base,
  },
  shortText: {
    flexShrink: 1,
  },
  historyLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: MEASUREMENTS.spacing.xs,
    paddingVertical: MEASUREMENTS.spacing.base,
  },
  chart: {
    marginTop: MEASUREMENTS.spacing.xl,
    marginHorizontal: -MEASUREMENTS.spacing.gutter,
  },
});
