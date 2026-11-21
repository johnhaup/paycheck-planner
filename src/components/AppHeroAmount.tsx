import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import Animated from "react-native-reanimated";
import { useCountUp } from "@/hooks/useCountUp";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";

/** Low enough that the largest accessibility text size (40pt × 3.57) still fits long amounts on one line */
const MIN_FONT_SCALE = 0.25;

interface Props {
  amount: number;
}

export function AppHeroAmount({ amount }: Props) {
  const colors = useColors();
  const { split, format } = useMoneyFormat();
  const targets = useMemo(() => [amount], [amount]);
  const { values, style } = useCountUp(targets);
  const shown = values[0];
  const { whole, cents } = split(shown);
  const isNegative = shown < 0;

  const wholeStyle = useMemo(
    () => (isNegative ? { color: colors.destructive } : undefined),
    [isNegative, colors]
  );

  return (
    <Animated.View style={style}>
      <AppText
        variant="hero"
        style={wholeStyle}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={MIN_FONT_SCALE}
        // VoiceOver and Maestro read the amount it is counting to
        accessibilityLabel={format(amount)}
      >
        {whole}
        <AppText variant="hero" color="textSecondary" style={styles.cents}>
          {cents}
        </AppText>
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cents: {
    fontSize: MEASUREMENTS.font.heroCents,
    letterSpacing: 0,
  },
});
