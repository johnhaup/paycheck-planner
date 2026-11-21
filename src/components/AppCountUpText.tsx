import { useMemo, type ComponentProps } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import { useCountUp } from "@/hooks/useCountUp";
import { AppText } from "@/components/AppText";

interface Props extends Omit<ComponentProps<typeof AppText>, "children" | "style"> {
  /** Every number in the text; they count to new values together */
  amounts: readonly number[];
  /** Builds the text from the amounts shown this frame */
  render: (amounts: readonly number[]) => string;
  /** Layout for the box around the text (flexShrink in a row) */
  style?: StyleProp<ViewStyle>;
}

/** Text with money in it that counts to its new values instead of snapping (`useCountUp`). */
export function AppCountUpText({ amounts, render, style, ...textProps }: Props) {
  const { values, style: fadeStyle } = useCountUp(amounts);

  const boxStyle = useMemo(() => [style, fadeStyle], [style, fadeStyle]);

  return (
    <Animated.View style={boxStyle}>
      <AppText
        {...textProps}
        style={styles.digits}
        // VoiceOver and Maestro read the text it is counting to
        accessibilityLabel={render(amounts)}
      >
        {render(values)}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Equal-width digits, so the line does not wobble while it counts
  digits: {
    fontVariant: ["tabular-nums"],
  },
});
