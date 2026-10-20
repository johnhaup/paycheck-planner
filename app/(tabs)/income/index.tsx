import { useCallback, useMemo } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { format } from "date-fns";
import { useStore } from "@/store";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppCard } from "@/components/AppCard";
import { AppFab } from "@/components/AppFab";
import { AppSectionHeader } from "@/components/AppSectionHeader";
import { IncomeSourceRow } from "@/components/income/IncomeSourceRow";
import { getPaychecks, getPaychecksPerMonth } from "@/utils/payDates";
import { formatMoney } from "@/utils/money";
import type { IncomeSource } from "@/types";

function keyExtractor(item: IncomeSource) {
  return item.id;
}

export default function IncomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const incomeSources = useStore((s) => s.incomeSources);
  const deleteIncomeSource = useStore((s) => s.deleteIncomeSource);

  const handleAdd = useCallback(() => {
    router.push("/income-form");
  }, [router]);

  const handleEdit = useCallback(
    (id: string) => {
      router.push({ pathname: "/income-form", params: { id } });
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: IncomeSource; index: number }) => (
      <IncomeSourceRow
        source={item}
        tintIndex={index}
        isFirst={index === 0}
        isLast={index === incomeSources.length - 1}
        onEdit={handleEdit}
        onDelete={deleteIncomeSource}
      />
    ),
    [handleEdit, deleteIncomeSource, incomeSources.length]
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
      perMonth: formatMoney(Math.round(perMonth)).replace(/\.00$/, ""),
      nextPayday: next ? format(next, "MMM d") : "—",
    };
  }, [incomeSources]);

  const listHeader = useMemo(
    () => (
      <View>
        <View style={styles.tiles}>
          <AppCard style={styles.tile}>
            <AppText variant="meta">Per month</AppText>
            <AppText variant="title">{summary.perMonth}</AppText>
          </AppCard>
          <AppCard style={styles.tile}>
            <AppText variant="meta">Next payday</AppText>
            <AppText variant="title">{summary.nextPayday}</AppText>
          </AppCard>
        </View>
        <AppSectionHeader title="Sources" />
      </View>
    ),
    [summary]
  );

  const listFooter = useMemo(
    () => (
      <AppText variant="caption" style={styles.hint}>
        Swipe left on a source to delete it.
      </AppText>
    ),
    []
  );

  const containerStyle = useMemo(
    () => [styles.container, { backgroundColor: colors.screenBackground }],
    [colors]
  );

  return (
    <View style={containerStyle}>
      {incomeSources.length === 0 ? (
        <View style={styles.empty}>
          <AppText variant="title" center>No income yet</AppText>
          <AppText variant="meta" center>
            Add your paychecks with the + button to start planning.
          </AppText>
        </View>
      ) : (
        <FlatList
          data={incomeSources}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.listContent}
        />
      )}
      <AppFab accessibilityLabel="Add income source" onPress={handleAdd} />
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
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.md,
    paddingHorizontal: MEASUREMENTS.spacing.section,
  },
});
