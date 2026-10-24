import { Pressable, View, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useT } from "@/hooks/useLocale";
import { AppText } from "@/components/AppText";
import { AppDateTile } from "@/components/AppDateTile";
import { AppHeroAmount } from "@/components/AppHeroAmount";
import { parseLocalDate } from "@/utils/payDates";
import { formatLongDate } from "@/utils/dates";

interface Props {
  sourceName: string;
  payDate: string;
  payAmount: number;
  totalAssigned: number;
  remaining: number;
  onEditPayAmount: () => void;
}

export function PayDateSummary({
  sourceName,
  payDate,
  payAmount,
  totalAssigned,
  remaining,
  onEditPayAmount,
}: Props) {
  const colors = useColors();
  const { format: formatMoney } = useMoneyFormat();
  const t = useT();
  const date = parseLocalDate(payDate);

  return (
    <View>
      <View style={styles.source}>
        <AppDateTile date={date} />
        <View style={styles.sourceText}>
          <AppText variant="rowTitle">{sourceName}</AppText>
          <AppText variant="meta">{formatLongDate(date)}</AppText>
        </View>
      </View>
      <AppText variant="meta" style={styles.heroLabel}>{t("payDate.leftAfterBills")}</AppText>
      <AppHeroAmount amount={remaining} />
      <Pressable
        style={styles.meta}
        onPress={onEditPayAmount}
        hitSlop={MEASUREMENTS.hitSlop}
        accessibilityRole="button"
        accessibilityLabel={t("paychecks.changePayAmount", { source: sourceName })}
      >
        <AppText variant="meta">
          {t("payDate.summaryMeta", { pay: formatMoney(payAmount), assigned: formatMoney(totalAssigned) })}
        </AppText>
        <Ionicons name="create-outline" size={14} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  source: {
    flexDirection: "row",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.base,
  },
  sourceText: {
    gap: MEASUREMENTS.spacing.xs,
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
});
