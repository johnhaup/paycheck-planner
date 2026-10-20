import { useCallback, useMemo, useState } from "react";
import { View, Pressable, Modal, StyleSheet, Platform } from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { useColors, useIsDark } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";

interface Props {
  value: Date;
  onChange: (date: Date) => void;
}

export function AppDatePicker({ value, onChange }: Props) {
  const colors = useColors();
  const isDark = useIsDark();
  const [visible, setVisible] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  const handlePress = useCallback(() => {
    setTempDate(value);
    setVisible(true);
  }, [value]);

  const handleChange = useCallback(
    (_event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === "android") {
        setVisible(false);
        if (selectedDate) {
          onChange(selectedDate);
        }
        return;
      }
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    },
    [onChange]
  );

  const handleDone = useCallback(() => {
    onChange(tempDate);
    setVisible(false);
  }, [onChange, tempDate]);

  const handleCancel = useCallback(() => {
    setVisible(false);
  }, []);

  const displayValue = useMemo(
    () => format(value, "EEE, MMM d, yyyy"),
    [value]
  );

  const triggerStyle = useMemo(
    () => [
      styles.trigger,
      {
        backgroundColor: colors.cardBackground,
        borderColor: colors.border,
      },
    ],
    [colors]
  );

  const overlayStyle = useMemo(
    () => [styles.overlay, { backgroundColor: colors.overlay }],
    [colors]
  );

  const sheetStyle = useMemo(
    () => [styles.sheet, { backgroundColor: colors.cardBackground }],
    [colors]
  );

  const sheetHeaderStyle = useMemo(
    () => [styles.sheetHeader, { borderBottomColor: colors.border }],
    [colors]
  );

  return (
    <View>
      <Pressable style={triggerStyle} onPress={handlePress}>
        <AppText variant="regular">{displayValue}</AppText>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <Pressable style={overlayStyle} onPress={handleCancel}>
          <Pressable style={sheetStyle}>
            <View style={sheetHeaderStyle}>
              <Pressable onPress={handleCancel} hitSlop={MEASUREMENTS.hitSlop}>
                <AppText variant="regular" color="textSecondary">
                  Cancel
                </AppText>
              </Pressable>
              <AppText variant="regular-bold">Select Date</AppText>
              <Pressable onPress={handleDone} hitSlop={MEASUREMENTS.hitSlop}>
                <AppText variant="regular-bold" color="primary">
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
          </Pressable>
        </Pressable>
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
