import { useMemo } from "react";
import { Pressable, SectionList, StyleSheet, type SectionListData } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useStore } from "@/store";
import { useColors } from "@/hooks/useColors";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useT } from "@/hooks/useLocale";
import { usePaycheckCardRenderer } from "@/hooks/usePaycheckCardRenderer";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppSectionHeader } from "@/components/AppSectionHeader";
import { buildPastMonthGroups, PAST_MONTHS } from "@/utils/paycheckMonths";
import { useProGate } from "@/hooks/useProGate";
import { ProBadge } from "@/components/ProBadge";
import type { PaycheckItem } from "@/components/paychecks/types";

interface HistorySection {
  key: string;
  title: string;
  trailing: string;
  data: PaycheckItem[];
}

function keyExtractor(item: PaycheckItem) {
  return item.key;
}

function renderSectionHeader({ section }: { section: SectionListData<PaycheckItem, HistorySection> }) {
  return <AppSectionHeader title={section.title} trailing={section.trailing} />;
}

export default function HistoryScreen() {
  const colors = useColors();
  const { format: formatMoney } = useMoneyFormat();
  const t = useT();
  const incomeSources = useStore((s) => s.incomeSources);
  const expenses = useStore((s) => s.expenses);
  const assignments = useStore((s) => s.assignments);
  const paycheckOverrides = useStore((s) => s.paycheckOverrides);
  const renderPaycheck = usePaycheckCardRenderer();
  const { isPro, openPaywall } = useProGate();

  const sections = useMemo<HistorySection[]>(
    () =>
      buildPastMonthGroups(
        incomeSources,
        expenses,
        assignments,
        paycheckOverrides,
        new Date(),
        isPro ? PAST_MONTHS.pro : PAST_MONTHS.free
      ).map(
        (month) => ({
          key: month.key,
          title: month.longLabel,
          trailing: t("paychecks.amountLeft", { amount: formatMoney(month.remaining) }),
          data: month.paychecks,
        })
      ),
    [incomeSources, expenses, assignments, paycheckOverrides, isPro, formatMoney, t]
  );

  const listFooter = useMemo(
    () =>
      isPro ? undefined : (
        <Pressable
          style={styles.unlockRow}
          onPress={openPaywall}
          accessibilityRole="button"
          accessibilityLabel={t("pro.earlierMonths")}
        >
          <AppText variant="bodyStrong" color="primaryText">{t("pro.earlierMonths")}</AppText>
          <ProBadge />
          <Ionicons name="chevron-forward" size={16} color={colors.primaryText} />
        </Pressable>
      ),
    [isPro, openPaywall, colors, t]
  );

  const listEmpty = useMemo(
    () => (
      <AppText variant="meta" center style={styles.empty}>
        {t("history.empty")}
      </AppText>
    ),
    [t]
  );

  const listStyle = useMemo(() => ({ backgroundColor: colors.screenBackground }), [colors]);

  return (
    <SectionList
      sections={sections}
      keyExtractor={keyExtractor}
      renderItem={renderPaycheck}
      renderSectionHeader={renderSectionHeader}
      ListEmptyComponent={listEmpty}
      ListFooterComponent={listFooter}
      stickySectionHeadersEnabled={false}
      style={listStyle}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: MEASUREMENTS.spacing.gutter,
    paddingBottom: MEASUREMENTS.spacing.bottom,
  },
  empty: {
    marginTop: MEASUREMENTS.spacing.section,
  },
  unlockRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: MEASUREMENTS.spacing.md,
    paddingVertical: MEASUREMENTS.spacing.xl,
  },
});
