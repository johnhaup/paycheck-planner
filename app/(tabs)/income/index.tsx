import { useCallback, useMemo } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "@/store";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useT } from "@/hooks/useLocale";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppCard } from "@/components/AppCard";
import { AppEmptyState } from "@/components/AppEmptyState";
import { AppFab } from "@/components/AppFab";
import { AppSectionHeader } from "@/components/AppSectionHeader";
import { IncomeSourceRow } from "@/components/income/IncomeSourceRow";
import { getPaychecks, getPaychecksPerMonth } from "@/utils/payDates";
import { formatMonthDay } from "@/utils/dates";
import { withUndo } from "@/utils/undo";
import type { IncomeSource } from "@/types";

function keyExtractor(item: IncomeSource) {
  return item.id;
}

export default function IncomeScreen() {
  const router = useRouter();
  const { whole: formatWholeMoney } = useMoneyFormat();
  const t = useT();
  const incomeSources = useStore((s) => s.incomeSources);
  const deleteIncomeSource = useStore((s) => s.deleteIncomeSource);
  const hasSources = incomeSources.length > 0;

  const handleAdd = useCallback(() => {
    router.push("/income-form");
  }, [router]);

  const handleEdit = useCallback(
    (id: string) => {
      router.push({ pathname: "/income-form", params: { id } });
    },
    [router]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const name = incomeSources.find((s) => s.id === id)?.name ?? "";
      withUndo(t("toasts.incomeDeleted", { name }), () => deleteIncomeSource(id));
    },
    [incomeSources, deleteIncomeSource, t]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: IncomeSource; index: number }) => (
      <IncomeSourceRow
        source={item}
        tintIndex={index}
        isFirst={index === 0}
        isLast={index === incomeSources.length - 1}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    ),
    [handleEdit, handleDelete, incomeSources.length]
  );

  const summary = useMemo(() => {
    const now = new Date();
    const perMonth = incomeSources.reduce(
      (sum, s) => sum + s.payAmount * getPaychecksPerMonth(s),
      0
    );
    const nextDates = incomeSources.map((s) => getPaychecks(s, now, 1)[0].date);
    const next = nextDates.sort((a, b) => a.getTime() - b.getTime())[0];
    return {
      perMonth: formatWholeMoney(perMonth),
      nextPayday: next ? formatMonthDay(next) : "—",
    };
    // t changes with the language, which changes the date format
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomeSources, formatWholeMoney, t]);

  const listHeader = useMemo(
    () => (
      <View>
        <View style={styles.tiles}>
          <AppCard style={styles.tile}>
            <AppText variant="meta">{t("income.perMonth")}</AppText>
            <AppText variant="title">{summary.perMonth}</AppText>
          </AppCard>
          <AppCard style={styles.tile}>
            <AppText variant="meta">{t("income.nextPayday")}</AppText>
            <AppText variant="title">{summary.nextPayday}</AppText>
          </AppCard>
        </View>
        <AppSectionHeader title={t("income.sources")} />
      </View>
    ),
    [summary, t]
  );

  const listFooter = useMemo(
    () => (
      <AppText variant="caption" style={styles.hint}>
        {t("income.swipeHint")}
      </AppText>
    ),
    [t]
  );

  const listEmpty = useMemo(
    () => (
      <AppEmptyState
        icon="cash-outline"
        title={t("income.emptyTitle")}
        body={t("income.emptyBody")}
        actionLabel={t("income.addSource")}
        onAction={handleAdd}
      />
    ),
    [handleAdd, t]
  );

  // The list is the screen's root view so iOS collapses the large title on scroll
  return (
    <>
      <FlatList
        data={incomeSources}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={hasSources ? listHeader : undefined}
        ListFooterComponent={hasSources ? listFooter : undefined}
        ListEmptyComponent={listEmpty}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={hasSources ? styles.listContent : styles.emptyContent}
      />
      <AppFab accessibilityLabel={t("income.addSource")} onPress={handleAdd} />
    </>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: MEASUREMENTS.spacing.gutter,
    paddingTop: MEASUREMENTS.spacing.md,
    paddingBottom: MEASUREMENTS.fabSize + MEASUREMENTS.spacing.bottom,
  },
  emptyContent: {
    flexGrow: 1,
    paddingBottom: MEASUREMENTS.fabSize + MEASUREMENTS.spacing.bottom,
  },
  tiles: {
    flexDirection: "row",
    gap: MEASUREMENTS.spacing.base,
  },
  tile: {
    flex: 1,
    padding: MEASUREMENTS.spacing.lg,
    gap: MEASUREMENTS.spacing.sm + 2,
  },
  hint: {
    marginTop: MEASUREMENTS.spacing.md + 2,
    paddingHorizontal: MEASUREMENTS.spacing.xs,
  },
});
