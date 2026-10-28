import { useCallback, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useStore } from "@/store";
import { useColors } from "@/hooks/useColors";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useT } from "@/hooks/useLocale";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppChip } from "@/components/AppChip";
import { AppButton } from "@/components/AppButton";
import {
  PaycheckPicker,
  getUpcomingPaycheckChoices,
  type PaycheckChoice,
} from "@/components/expenseForm/PaycheckPicker";
import { getPaycheck, parseLocalDate } from "@/utils/payDates";
import { buildPaycheckItem } from "@/utils/paycheckMonths";
import { formatShortDate } from "@/utils/dates";
import { hapticSuccess } from "@/utils/haptics";
import { withUndo } from "@/utils/undo";

export default function MoveBillScreen() {
  const router = useRouter();
  const colors = useColors();
  const { format: formatMoney } = useMoneyFormat();
  const t = useT();
  const { payDate, sourceId, expenseId: initialExpenseId } = useLocalSearchParams<{
    payDate: string;
    sourceId: string;
    expenseId?: string;
  }>();
  const incomeSources = useStore((s) => s.incomeSources);
  const expenses = useStore((s) => s.expenses);
  const assignments = useStore((s) => s.assignments);
  const paycheckOverrides = useStore((s) => s.paycheckOverrides);
  const moveExpense = useStore((s) => s.moveExpense);

  const from = useMemo<PaycheckChoice>(() => ({ payDate, sourceId }), [payDate, sourceId]);

  const item = useMemo(() => {
    const source = incomeSources.find((s) => s.id === sourceId);
    const paycheck = source ? getPaycheck(source, payDate) : undefined;
    return source && paycheck
      ? buildPaycheckItem(source, paycheck, expenses, assignments, paycheckOverrides)
      : undefined;
  }, [incomeSources, sourceId, payDate, expenses, assignments, paycheckOverrides]);

  // Largest unpaid bill first: it's the one most likely to clear the shortfall
  const bills = useMemo(
    () => (item?.expenses ?? []).filter((e) => !e.paid).sort((a, b) => b.amount - a.amount),
    [item]
  );

  const [expenseId, setExpenseId] = useState<string | undefined>(
    () => bills.find((b) => b.expenseId === initialExpenseId)?.expenseId ?? bills[0]?.expenseId
  );
  const [target, setTarget] = useState<PaycheckChoice | undefined>(
    () => getUpcomingPaycheckChoices(incomeSources, new Date(), from)[0]
  );

  const handleMove = useCallback(() => {
    if (!expenseId || !target) {
      return;
    }
    const payee = bills.find((b) => b.expenseId === expenseId)?.payee ?? "";
    const targetDate = formatShortDate(parseLocalDate(target.payDate));
    withUndo(t("toasts.billMoved", { payee, date: targetDate }), () => moveExpense(expenseId, from, target));
    hapticSuccess();
    router.back();
  }, [expenseId, target, bills, moveExpense, from, router, t]);

  const containerStyle = useMemo(
    () => [styles.container, { backgroundColor: colors.modalBackground }],
    [colors]
  );

  const date = formatShortDate(parseLocalDate(payDate));
  const subtitle = !item
    ? ""
    : item.remaining < 0
      ? t("moveBillSheet.subtitle", { amount: formatMoney(-item.remaining), date })
      : t("moveBillSheet.fromPaycheck", { date, source: item.sourceName });
  const canMove = !!expenseId && !!target;

  return (
    <View style={containerStyle}>
      <View style={styles.heading}>
        <AppText variant="title">{t("moveBillSheet.title")}</AppText>
        <AppText variant="meta">{subtitle}</AppText>
      </View>

      <AppText variant="section" style={styles.label}>{t("moveBillSheet.bill")}</AppText>
      {bills.length === 0 ? (
        <AppText variant="meta">{t("moveBillSheet.noBills")}</AppText>
      ) : (
        <View style={styles.chipRow}>
          {bills.map((bill) => (
            <AppChip
              key={bill.expenseId}
              label={t("moveBillSheet.billLabel", {
                payee: bill.payee,
                amount: formatMoney(bill.amount),
              })}
              value={bill.expenseId}
              selected={bill.expenseId === expenseId}
              onSelect={setExpenseId}
            />
          ))}
        </View>
      )}

      <AppText variant="section" style={styles.label}>{t("moveBillSheet.toPaycheck")}</AppText>
      {target ? (
        <PaycheckPicker value={target} exclude={from} onChange={setTarget} />
      ) : (
        <AppText variant="meta">{t("moveBillSheet.noPaychecks")}</AppText>
      )}

      <AppButton
        title={t("common.move")}
        onPress={handleMove}
        disabled={!canMove}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: MEASUREMENTS.spacing.gutter,
    paddingTop: MEASUREMENTS.spacing.xxl,
    paddingBottom: MEASUREMENTS.spacing.bottom,
  },
  heading: {
    gap: MEASUREMENTS.spacing.xs,
  },
  label: {
    marginTop: MEASUREMENTS.spacing.xxl,
    marginBottom: MEASUREMENTS.spacing.md + 2,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: MEASUREMENTS.spacing.md,
  },
  button: {
    marginTop: MEASUREMENTS.spacing.section,
  },
});
