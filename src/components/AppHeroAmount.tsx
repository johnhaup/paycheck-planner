import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { splitMoney } from "@/utils/money";

interface Props {
  amount: number;
}

export function AppHeroAmount({ amount }: Props) {
  const colors = useColors();
  const { whole, cents } = splitMoney(amount);

  const wholeStyle = useMemo(
    () => (amount < 0 ? { color: colors.destructive } : undefined),
    [amount, colors]
  );

  return (
    <AppText variant="hero" style={wholeStyle}>
      {whole}
      <AppText variant="hero" color="textSecondary" style={styles.cents}>
        {cents}
      </AppText>
    </AppText>
  );
}

const styles = StyleSheet.create({
  cents: {
    fontSize: MEASUREMENTS.font.heroCents,
    letterSpacing: 0,
  },
});
