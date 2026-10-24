import { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useStore } from "@/store";
import { useColors } from "@/hooks/useColors";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useT } from "@/hooks/useLocale";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppInput } from "@/components/AppInput";
import { AppButton } from "@/components/AppButton";
import { parseLocalDate } from "@/utils/payDates";
import { formatShortDate } from "@/utils/dates";

export default function PaycheckAmountScreen() {
  const router = useRouter();
  const colors = useColors();
  const { format: formatMoney } = useMoneyFormat();
  const t = useT();
  const { payDate, sourceId } = useLocalSearchParams<{ payDate: string; sourceId: string }>();
  const source = useStore((s) => s.incomeSources.find((e) => e.id === sourceId));
  const override = useStore((s) =>
    s.paycheckOverrides.find((o) => o.sourceId === sourceId && o.payDate === payDate)
  );
  const setPaycheckAmount = useStore((s) => s.setPaycheckAmount);
  const [amount, setAmount] = useState(() =>
    String(override?.payAmount ?? source?.payAmount ?? "")
  );

  const handleSave = useCallback(() => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed < 0) {
      Alert.alert(t("common.error"), t("payAmountSheet.invalidAmount"));
      return;
    }
    setPaycheckAmount(sourceId, payDate, parsed === source?.payAmount ? undefined : parsed);
    router.back();
  }, [amount, setPaycheckAmount, sourceId, payDate, source, router, t]);

  const handleReset = useCallback(() => {
    setPaycheckAmount(sourceId, payDate, undefined);
    router.back();
  }, [setPaycheckAmount, sourceId, payDate, router]);

  const containerStyle = useMemo(
    () => [styles.container, { backgroundColor: colors.modalBackground }],
    [colors]
  );

  const subtitle = payDate
    ? t("payAmountSheet.subtitle", { date: formatShortDate(parseLocalDate(payDate)) })
    : "";

  return (
    <View style={containerStyle}>
      <View style={styles.heading}>
        <AppText variant="title">{source?.name ?? t("screens.incomeSource")}</AppText>
        <AppText variant="meta">{subtitle}</AppText>
      </View>
      <AppInput
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        autoFocus
        selectTextOnFocus
      />
      <AppText variant="caption" style={styles.hint}>
        {t("payAmountSheet.hint", { amount: formatMoney(source?.payAmount ?? 0) })}
      </AppText>
      <View style={styles.actions}>
        <AppButton title={t("common.save")} onPress={handleSave} />
        {override ? (
          <AppButton title={t("payAmountSheet.useDefault")} variant="outline" onPress={handleReset} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: MEASUREMENTS.spacing.gutter,
    paddingTop: MEASUREMENTS.spacing.xxl,
  },
  heading: {
    gap: MEASUREMENTS.spacing.xs,
    marginBottom: MEASUREMENTS.spacing.lg,
  },
  hint: {
    marginTop: MEASUREMENTS.spacing.sm + 2,
  },
  actions: {
    gap: MEASUREMENTS.spacing.md,
    marginTop: MEASUREMENTS.spacing.xl,
  },
});
