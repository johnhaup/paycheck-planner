import { useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useColors } from "@/hooks/useColors";
import { useDatePickerStore, type DatePickerMode } from "@/stores/datePickerStore";
import { useLocale } from "@/hooks/useLocale";
import { formatFullDate, formatTimeOfDay } from "@/utils/dates";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";

interface Props {
  value: Date;
  mode?: DatePickerMode;
  onChange: (date: Date) => void;
}

export function AppDatePicker({ value, mode = "date", onChange }: Props) {
  const router = useRouter();
  const colors = useColors();
  const { localeTag } = useLocale();
  const setRequest = useDatePickerStore((s) => s.setRequest);

  const handleAndroidChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (event.type === "set" && selectedDate) {
        onChange(selectedDate);
      }
    },
    [onChange]
  );

  const handlePress = useCallback(() => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({ value, mode, onChange: handleAndroidChange });
      return;
    }
    setRequest({ value, mode, onChange });
    router.push("/date-picker");
  }, [value, mode, onChange, handleAndroidChange, setRequest, router]);

  const displayValue = useMemo(
    () =>
      mode === "time"
        ? formatTimeOfDay(value.getHours(), value.getMinutes())
        : formatFullDate(value),
    // localeTag drives the Intl formatters
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value, mode, localeTag]
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

  return (
    <Pressable style={triggerStyle} onPress={handlePress}>
      <AppText variant="body">{displayValue}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trigger: {
    padding: MEASUREMENTS.spacing.base + 2,
    borderRadius: MEASUREMENTS.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
