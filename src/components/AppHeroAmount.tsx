import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";

interface Props {
  amount: number;
}

export function AppHeroAmount({ amount }: Props) {
  const colors = useColors();
  const { split } = useMoneyFormat();
  const shown = useAnimatedNumber(amount);
  const { whole, cents } = split(shown);
  const isNegative = shown < 0;

  const wholeStyle = useMemo(
    () => (isNegative ? { color: colors.destructive } : undefined),
    [isNegative, colors]
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
