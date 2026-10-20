import { useMemo, type ReactNode } from "react";
import { View, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function AppCard({ children, style }: Props) {
  const colors = useColors();

  const cardStyle = useMemo(
    () => [styles.card, { backgroundColor: colors.cardBackground }, style],
    [colors, style]
  );

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: MEASUREMENTS.radius.card,
    overflow: "hidden",
  },
});
