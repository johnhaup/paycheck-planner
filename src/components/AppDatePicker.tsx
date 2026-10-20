import { useCallback, useMemo, useState } from "react";
import { View, Pressable, Modal, StyleSheet, Platform, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { useColors, useIsDark } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";

const SHEET_TIMING = { duration: 280, easing: Easing.out(Easing.cubic) };

interface Props {
  value: Date;
  onChange: (date: Date) => void;
}

export function AppDatePicker({ value, onChange }: Props) {
  const colors = useColors();
  const isDark = useIsDark();
  const [visible, setVisible] = useState(false);
  const [tempDate, setTempDate] = useState(value);
  const { height } = useWindowDimensions();
  const progress = useSharedValue(0);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.get()) * height }],
  }));

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  const close = useCallback(() => {
    progress.set(withTiming(0, SHEET_TIMING, (finished) => {
      if (finished) {
        scheduleOnRN(hide);
      }
    }));
  }, [progress, hide]);

  const handlePress = useCallback(() => {
    setTempDate(value);
    setVisible(true);
    progress.set(withTiming(1, SHEET_TIMING));
  }, [value, progress]);

  const handleChange = useCallback(
    (_event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === "android") {
        close();
        if (selectedDate) {
          onChange(selectedDate);
        }
        return;
      }
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    },
    [onChange, close]
  );

  const handleDone = useCallback(() => {
    onChange(tempDate);
    close();
  }, [onChange, tempDate, close]);

  const displayValue = useMemo(
    () => format(value, "EEE, MMM d, yyyy"),
    [value]
  );

  const triggerStyle = useMemo(
    () => [
      styles.trigger,
      {
        backgroundColor: colors.inputBackground,
        borderColor: colors.border,
      },
    ],
    [colors]
  );

  const backdropStyle = useMemo(
    () => [StyleSheet.absoluteFill, { backgroundColor: colors.overlay }, backdropAnimatedStyle],
    [colors, backdropAnimatedStyle]
  );

  const sheetStyle = useMemo(
    () => [styles.sheet, { backgroundColor: colors.cardBackgroundElevated }, sheetAnimatedStyle],
    [colors, sheetAnimatedStyle]
  );

  const sheetHeaderStyle = useMemo(
    () => [styles.sheetHeader, { borderBottomColor: colors.border }],
    [colors]
  );

  return (
    <View>
      <Pressable style={triggerStyle} onPress={handlePress}>
        <AppText variant="body">{displayValue}</AppText>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={close}
      >
        <View style={styles.overlay}>
          <Animated.View style={backdropStyle}>
            <Pressable style={StyleSheet.absoluteFill} onPress={close} />
          </Animated.View>
          <Animated.View style={sheetStyle}>
            <View style={sheetHeaderStyle}>
              <Pressable onPress={close} hitSlop={MEASUREMENTS.hitSlop}>
                <AppText variant="body" color="textSecondary">
                  Cancel
                </AppText>
              </Pressable>
              <AppText variant="bodyStrong">Select Date</AppText>
              <Pressable onPress={handleDone} hitSlop={MEASUREMENTS.hitSlop}>
                <AppText variant="bodyStrong" color="primaryText">
                  Done
                </AppText>
              </Pressable>
            </View>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="inline"
              onChange={handleChange}
              themeVariant={isDark ? "dark" : "light"}
              accentColor={colors.primary}
              style={styles.picker}
            />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    padding: MEASUREMENTS.spacing.base + 2,
    borderRadius: MEASUREMENTS.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: MEASUREMENTS.radius.xl + 4,
    borderTopRightRadius: MEASUREMENTS.radius.xl + 4,
    paddingBottom: MEASUREMENTS.spacing.bottom,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: MEASUREMENTS.spacing.lg,
    paddingVertical: MEASUREMENTS.spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  picker: {
    alignSelf: "center",
  },
});
