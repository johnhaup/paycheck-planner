import { useEffect, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { FADE } from "@/constants/motion";

interface Props {
  paid: number;
  total: number;
}

/** One segment per bill reads well up to about a dozen; beyond that, collapse to a bar */
const MAX_SEGMENTS = 12;

export function PaidProgress({ paid, total }: Props) {
  const colors = useColors();

  const barStyles = useMemo(
    () => [
      [styles.segment, { flex: Math.max(paid, 0.001), backgroundColor: colors.primary }],
      [styles.segment, { flex: Math.max(total - paid, 0.001), backgroundColor: colors.border }],
    ],
    [paid, total, colors]
  );

  if (total === 0) return null;

  return (
    <View style={styles.row}>
      {total <= MAX_SEGMENTS
        ? Array.from({ length: total }, (_, i) => <Segment key={i} paid={i < paid} />)
        : barStyles.map((style, i) => <View key={i} style={style} />)}
    </View>
  );
}

interface SegmentProps {
  paid: boolean;
}

/** Fades to the paid colour (also under Reduce Motion) instead of snapping */
function Segment({ paid }: SegmentProps) {
  const colors = useColors();
  const progress = useSharedValue(paid ? 1 : 0);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.get(), [0, 1], [colors.border, colors.primary]),
  }));

  const style = useMemo(() => [styles.segment, animatedStyle], [animatedStyle]);

  useEffect(() => {
    progress.set(withTiming(paid ? 1 : 0, FADE));
  }, [paid, progress]);

  return <Animated.View style={style} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: MEASUREMENTS.spacing.sm,
    paddingHorizontal: MEASUREMENTS.spacing.lg,
    paddingBottom: MEASUREMENTS.spacing.base,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
});
