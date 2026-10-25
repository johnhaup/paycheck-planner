import { useCallback, useMemo } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useT } from "@/hooks/useLocale";
import { formatWeekday } from "@/utils/dates";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppCard } from "@/components/AppCard";
import { AppDateTile } from "@/components/AppDateTile";
import { AppText } from "@/components/AppText";
import { PaidProgress } from "@/components/paychecks/PaidProgress";
import { PaycheckExpenseRow } from "@/components/paychecks/PaycheckExpenseRow";
import type {
  EditAmountHandler,
  LinkTapHandler,
  PaycheckItem,
  TogglePaidHandler,
} from "@/components/paychecks/types";

interface Props {
  item: PaycheckItem;
  onPress: (payDate: string, sourceId: string) => void;
  onTogglePaid: TogglePaidHandler;
  onLinkTap: LinkTapHandler;
  onEditAmount: EditAmountHandler;
  onEditPayAmount: (payDate: string, sourceId: string) => void;
  onMoveBill: (payDate: string, sourceId: string) => void;
}

export function PaycheckCard({
  item,
  onPress,
  onTogglePaid,
  onLinkTap,
  onEditAmount,
  onEditPayAmount,
  onMoveBill,
}: Props) {
  const colors = useColors();
  const { format: formatMoney } = useMoneyFormat();
  const t = useT();

  const handlePress = useCallback(() => {
    onPress(item.payDate, item.sourceId);
  }, [onPress, item.payDate, item.sourceId]);

  const handleEditPayAmount = useCallback(() => {
    onEditPayAmount(item.payDate, item.sourceId);
  }, [onEditPayAmount, item.payDate, item.sourceId]);

  const handleMoveBill = useCallback(() => {
    onMoveBill(item.payDate, item.sourceId);
  }, [onMoveBill, item.payDate, item.sourceId]);

  const shortRowStyle = useMemo(
    () => [styles.shortRow, { borderTopColor: colors.divider }],
    [colors]
  );

  const emptyRowStyle = useMemo(
    () => [styles.emptyRow, { borderTopColor: colors.divider }],
    [colors]
  );

  const billCount = item.expenses.length;
  const canMoveBill = item.remaining < 0 && item.paidCount < billCount;
  const weekday = formatWeekday(item.date);
  const meta =
    billCount === 0
      ? weekday
      : `${weekday} · ${t("paychecks.paidProgress", { paid: item.paidCount, total: billCount })}`;

  return (
    <AppCard style={styles.card}>
      <Pressable
        style={styles.header}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityHint={t("paychecks.opensPaycheck")}
      >
        <AppDateTile date={item.date} />
        <View style={styles.headerText}>
          <AppText variant="rowTitle" numberOfLines={1}>{item.sourceName}</AppText>
          <AppText variant="meta">{meta}</AppText>
        </View>
        <View style={styles.amounts}>
          <Pressable
            onPress={handleEditPayAmount}
            hitSlop={MEASUREMENTS.hitSlop}
            accessibilityRole="button"
            accessibilityLabel={t("paychecks.changePayAmount", { source: item.sourceName })}
          >
            <AppText variant="rowTitle">{formatMoney(item.payAmount)}</AppText>
          </Pressable>
          <AppText variant="meta" color={item.remaining < 0 ? "destructive" : "primaryText"}>
            {t("paychecks.amountLeft", { amount: formatMoney(item.remaining) })}
          </AppText>
        </View>
      </Pressable>
      <PaidProgress paid={item.paidCount} total={billCount} />
      {billCount > 0 ? (
        item.expenses.map((expense) => (
          <PaycheckExpenseRow
            key={expense.assignmentId || expense.expenseId}
            expense={expense}
            payDate={item.payDate}
            sourceId={item.sourceId}
            onTogglePaid={onTogglePaid}
            onLinkTap={onLinkTap}
            onEditAmount={onEditAmount}
          />
        ))
      ) : (
        <Pressable style={emptyRowStyle} onPress={handlePress}>
          <AppText variant="meta" color="textMuted">{t("paychecks.noBillsYet")}</AppText>
        </Pressable>
      )}
      {canMoveBill ? (
        <Pressable
          style={shortRowStyle}
          onPress={handleMoveBill}
          accessibilityRole="button"
          accessibilityLabel={t("paychecks.moveBill")}
        >
          <Ionicons name="alert-circle" size={16} color={colors.destructive} />
          <AppText variant="meta" color="destructive" style={styles.shortText}>
            {t("paychecks.shortBy", { amount: formatMoney(-item.remaining) })}
          </AppText>
          <AppText variant="bodyStrong" color="primaryText">{t("paychecks.moveBill")}</AppText>
        </Pressable>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: MEASUREMENTS.spacing.base,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.base,
    padding: MEASUREMENTS.spacing.lg,
  },
  headerText: {
    flex: 1,
    gap: MEASUREMENTS.spacing.xs,
  },
  amounts: {
    alignItems: "flex-end",
    gap: MEASUREMENTS.spacing.xs,
  },
  emptyRow: {
    paddingHorizontal: MEASUREMENTS.spacing.lg,
    paddingVertical: MEASUREMENTS.spacing.base,
    borderTopWidth: 1,
  },
  shortRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.md,
    paddingHorizontal: MEASUREMENTS.spacing.lg,
    paddingVertical: MEASUREMENTS.spacing.base,
    borderTopWidth: 1,
  },
  shortText: {
    flex: 1,
  },
});
