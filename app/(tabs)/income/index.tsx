import { useCallback, useMemo, useRef } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "@/store";
import { useAccessibilityTextSize } from "@/hooks/useAccessibilityTextSize";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useT } from "@/hooks/useLocale";
import { MEASUREMENTS } from "@/constants/measurements";
import { useGutters } from "@/hooks/useGutters";
import { useColumns } from "@/hooks/useColumns";
import { LARGE_TITLE_LIST, LARGE_TITLE_LIST_CONTENT } from "@/constants/direction";
import { AppText } from "@/components/AppText";
import { closeOpenSwipeRow } from "@/components/AppSwipeActions";
import { AppCountUpText } from "@/components/AppCountUpText";
import { AppCard } from "@/components/AppCard";
import { AppEmptyState } from "@/components/AppEmptyState";
import { AppFab } from "@/components/AppFab";
import { AppSectionHeader } from "@/components/AppSectionHeader";
import { IncomeSourceRow } from "@/components/income/IncomeSourceRow";
import { getPaychecks, getPaychecksPerMonth } from "@/utils/payDates";
import { formatMonthDay } from "@/utils/dates";
import { withUndo } from "@/utils/undo";
import { useProGate } from "@/hooks/useProGate";
import type { IncomeSource } from "@/types";
import { LayoutAnimationConfig } from "react-native-reanimated";
import { AppAnimatedListCell } from "@/components/AppAnimatedListCell";
import { useScrollKeptOnResize } from "@/hooks/useScrollKeptOnResize";

/** A total or date too long for its tile shrinks this far instead of breaking mid-number */
const TILE_VALUE_MIN_FONT_SCALE = 0.5;

function keyExtractor(item: IncomeSource) {
  return item.id;
}

export default function IncomeScreen() {
  const scrollRef = useRef<FlatList<IncomeSource>>(null);
  const keptScroll = useScrollKeptOnResize(scrollRef);
  const router = useRouter();
  const { whole: formatWholeMoney } = useMoneyFormat();
  const t = useT();
  const stacked = useAccessibilityTextSize();
  const incomeSources = useStore((s) => s.incomeSources);
  const deleteIncomeSource = useStore((s) => s.deleteIncomeSource);
  const hasSources = incomeSources.length > 0;
  // Free includes one income source; adding another is Pro
  const { locked: addLocked, gate } = useProGate(hasSources);

  const handleAdd = useCallback(() => {
    router.push("/income-form");
  }, [router]);
  const handleAddGated = useMemo(() => gate(handleAdd), [gate, handleAdd]);

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
      perMonth: [perMonth],
      nextPayday: next ? formatMonthDay(next) : "—",
    };
    // t changes with the language, which changes the date format
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomeSources, t]);

  const renderPerMonth = useCallback(
    (amounts: readonly number[]) => formatWholeMoney(amounts[0]),
    [formatWholeMoney]
  );

  // Regular width (iPhone Duo unfolded): the totals in the first column, the sources in the second.
  // The list's content keeps to the second column and the tiles are placed back into the first,
  // so a fold changes styles only and the list stays as it is.
  const gutters = useGutters();
  const emptyGutters = useGutters(0);
  const columns = useColumns();
  const tilesStyle = useMemo(
    () => [
      stacked ? styles.tilesStacked : styles.tiles,
      columns
        ? [styles.tilesWide, { start: gutters.paddingLeft - columns.pastMiddle, width: columns.startWidth }]
        : undefined,
    ],
    [stacked, columns, gutters]
  );

  const listHeader = useMemo(
    () => (
      <View>
        <View style={tilesStyle}>
          <AppCard style={stacked ? styles.tileStacked : styles.tile}>
            <AppText variant="meta">{t("income.perMonth")}</AppText>
            <AppCountUpText
              variant="title"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={TILE_VALUE_MIN_FONT_SCALE}
              amounts={summary.perMonth}
              render={renderPerMonth}
            />
          </AppCard>
          <AppCard style={stacked ? styles.tileStacked : styles.tile}>
            <AppText variant="meta">{t("income.nextPayday")}</AppText>
            <AppText
              variant="title"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={TILE_VALUE_MIN_FONT_SCALE}
            >
              {summary.nextPayday}
            </AppText>
          </AppCard>
        </View>
        <AppSectionHeader title={t("income.sources")} />
      </View>
    ),
    [summary, renderPerMonth, t, stacked, tilesStyle]
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

  const contentStyle = useMemo(
    () =>
      hasSources
        ? [
            styles.listContent,
            gutters,
            columns ? { paddingLeft: columns.pastMiddle } : undefined,
            LARGE_TITLE_LIST_CONTENT,
          ]
        : [styles.emptyContent, emptyGutters, LARGE_TITLE_LIST_CONTENT],
    [hasSources, gutters, emptyGutters, columns]
  );

  // The list is the screen's root view so iOS collapses the large title on scroll
  return (
    <>
      <LayoutAnimationConfig skipEntering>
        <FlatList
          ref={scrollRef}
          {...keptScroll}
          style={LARGE_TITLE_LIST}
          data={incomeSources}
          CellRendererComponent={AppAnimatedListCell}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={hasSources ? listHeader : undefined}
          ListFooterComponent={hasSources ? listFooter : undefined}
          ListEmptyComponent={listEmpty}
          onScrollBeginDrag={closeOpenSwipeRow}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={contentStyle}
        />
      </LayoutAnimationConfig>
      <AppFab accessibilityLabel={t("income.addSource")} onPress={handleAddGated} pro={addLocked} />
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
  tiles: {
    flexDirection: "row",
    gap: MEASUREMENTS.spacing.base,
  },
  // At accessibility text sizes each tile takes the full width, one above the other
  tilesStacked: {
    gap: MEASUREMENTS.spacing.base,
  },
  // Level with the sources card: below the section title's margins and its line of text
  tilesWide: {
    position: "absolute",
    top: MEASUREMENTS.spacing.xxl + MEASUREMENTS.spacing.md + 2 + 17,
  },
  tile: {
    flex: 1,
    padding: MEASUREMENTS.spacing.lg,
    gap: MEASUREMENTS.spacing.sm + 2,
  },
  tileStacked: {
    padding: MEASUREMENTS.spacing.lg,
    gap: MEASUREMENTS.spacing.sm + 2,
  },
  hint: {
    marginTop: MEASUREMENTS.spacing.md + 2,
    paddingHorizontal: MEASUREMENTS.spacing.xs,
  },
});
