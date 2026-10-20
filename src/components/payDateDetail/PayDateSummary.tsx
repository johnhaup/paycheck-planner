import { View, StyleSheet } from "react-native";
import { format } from "date-fns";
import { MEASUREMENTS } from "@/constants/measurements";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { AppText } from "@/components/AppText";
import { AppDateTile } from "@/components/AppDateTile";
import { AppHeroAmount } from "@/components/AppHeroAmount";
import { parseLocalDate } from "@/utils/payDates";

interface Props {
  sourceName: string;
  payDate: string;
  payAmount: number;
  totalAssigned: number;
  remaining: number;
}

export function PayDateSummary({ sourceName, payDate, payAmount, totalAssigned, remaining }: Props) {
  const { format: formatMoney } = useMoneyFormat();
  const date = parseLocalDate(payDate);

  return (
    <View>
      <View style={styles.source}>
        <AppDateTile date={date} />
        <View style={styles.sourceText}>
          <AppText variant="rowTitle">{sourceName}</AppText>
          <AppText variant="meta">{format(date, "EEEE, MMMM d")}</AppText>
        </View>
      </View>
      <AppText variant="meta" style={styles.heroLabel}>Left after bills</AppText>
      <AppHeroAmount amount={remaining} />
      <AppText variant="meta">
        {formatMoney(payAmount)} paycheck · {formatMoney(totalAssigned)} assigned
      </AppText>
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
});
