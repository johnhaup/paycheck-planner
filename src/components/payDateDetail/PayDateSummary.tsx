import { useCallback, useMemo, type ReactNode } from "react";
import { Pressable, View, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAccessibilityTextSize } from "@/hooks/useAccessibilityTextSize";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { dimOnPress } from "@/constants/press";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useT } from "@/hooks/useLocale";
import { AppText } from "@/components/AppText";
import { AppWordWrapText } from "@/components/AppWordWrapText";
import { AppDateTile } from "@/components/AppDateTile";
import { AppHeroAmount } from "@/components/AppHeroAmount";
import { AppCountUpText } from "@/components/AppCountUpText";
import { parseLocalDate } from "@/utils/payDates";
import { formatLongDate } from "@/utils/dates";

interface Props {
  sourceName: string;
  payDate: string;
  payAmount: number;
  totalAssigned: number;
  remaining: number;
  /** Whether at least one unpaid bill could be moved off this paycheck */
  canMoveBill: boolean;
  onEditPayAmount: () => void;
  onMoveBill: () => void;
  /** A control at the end of the first row, for where the screen has no navigation bar of its own */
  action?: ReactNode;
}

export function PayDateSummary({
  sourceName,
  payDate,
  payAmount,
  totalAssigned,
  remaining,
  canMoveBill,
  onEditPayAmount,
  onMoveBill,
  action,
}: Props) {
  const colors = useColors();
  const { format: formatMoney } = useMoneyFormat();
  const t = useT();
  const stacked = useAccessibilityTextSize();
  const date = parseLocalDate(payDate);

  const metaAmounts = useMemo(() => [payAmount, totalAssigned], [payAmount, totalAssigned]);
  const remainingAmounts = useMemo(() => [remaining], [remaining]);
  const renderMeta = useCallback(
    ([pay, assigned]: readonly number[]) =>
      t("payDate.summaryMeta", { pay: formatMoney(pay), assigned: formatMoney(assigned) }),
    [t, formatMoney]
  );
  const renderShort = useCallback(
    (amounts: readonly number[]) => t("paychecks.shortBy", { amount: formatMoney(-amounts[0]) }),
    [t, formatMoney]
  );

  const metaStyle = useMemo(() => dimOnPress(styles.meta), []);
  const shortRowStyle = useMemo(
    () => dimOnPress(stacked ? styles.shortRowStacked : styles.shortRow),
    [stacked]
  );

  return (
    <View>
      <View style={stacked ? styles.sourceStacked : styles.source}>
        <AppDateTile date={date} />
        <View style={stacked ? styles.sourceTextStacked : styles.sourceText}>
          {stacked ? (
            <AppWordWrapText variant="rowTitle">{sourceName}</AppWordWrapText>
          ) : (
            <AppText variant="rowTitle">{sourceName}</AppText>
          )}
          <AppText variant="meta">{formatLongDate(date)}</AppText>
        </View>
        {action}
      </View>
      <AppText variant="meta" style={styles.heroLabel}>{t("payDate.leftAfterBills")}</AppText>
      <AppHeroAmount amount={remaining} />
      <Pressable
        style={metaStyle}
        onPress={onEditPayAmount}
        hitSlop={MEASUREMENTS.hitSlop}
        accessibilityRole="button"
        accessibilityLabel={t("paychecks.changePayAmount", { source: sourceName })}
      >
        <AppCountUpText variant="meta" style={styles.shrink} amounts={metaAmounts} render={renderMeta} />
        <Ionicons name="create-outline" size={14} color={colors.textMuted} />
      </Pressable>
      {remaining < 0 && canMoveBill ? (
        <Pressable
          style={shortRowStyle}
          onPress={onMoveBill}
          hitSlop={MEASUREMENTS.hitSlop}
          accessibilityRole="button"
          accessibilityLabel={t("paychecks.moveBill")}
        >
          <Ionicons name="alert-circle" size={16} color={colors.destructive} />
          <AppCountUpText
            variant="meta"
            color="destructive"
            style={stacked ? undefined : styles.shrink}
            amounts={remainingAmounts}
            render={renderShort}
          />
          <AppText variant="bodyStrong" color="primaryText">{t("paychecks.moveBill")}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  source: {
    flexDirection: "row",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.base,
  },
  sourceStacked: {
    alignItems: "flex-start",
    gap: MEASUREMENTS.spacing.base,
  },
  sourceText: {
    flex: 1,
    gap: MEASUREMENTS.spacing.xs,
  },
  sourceTextStacked: {
    gap: MEASUREMENTS.spacing.xs,
  },
  shrink: {
    flexShrink: 1,
  },
  heroLabel: {
    marginTop: MEASUREMENTS.spacing.xl,
  },
  meta: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.sm + 2,
  },
  shortRow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.md,
    marginTop: MEASUREMENTS.spacing.base,
  },
  shortRowStacked: {
    alignItems: "flex-start",
    gap: MEASUREMENTS.spacing.md,
    marginTop: MEASUREMENTS.spacing.base,
  },
});
