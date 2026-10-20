import { useCallback, useMemo } from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";

interface Props {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const TRACK_WIDTH = 48;
const TRACK_HEIGHT = 28;
const THUMB_SIZE = 22;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - 6;

export function AppToggle({ value, onValueChange }: Props) {
  const colors = useColors();

  const handlePress = useCallback(() => {
    onValueChange(!value);
  }, [value, onValueChange]);

  const trackStyle = useMemo(
    () => [
      styles.track,
      { backgroundColor: value ? colors.primary : colors.border },
    ],
    [value, colors]
  );

  const thumbStyle = useMemo(
    () => [
      styles.thumb,
      {
        backgroundColor: colors.onPrimary,
        transform: [{ translateX: value ? THUMB_TRAVEL : 0 }],
      },
    ],
    [value, colors]
  );

  return (
    <Pressable onPress={handlePress} hitSlop={MEASUREMENTS.hitSlop}>
      <View style={trackStyle}>
        <View style={thumbStyle} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
  },
});
