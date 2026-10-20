import { useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { useColors } from "@/hooks/useColors";
import { useDatePickerStore } from "@/stores/datePickerStore";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";

interface Props {
  value: Date;
  onChange: (date: Date) => void;
}

export function AppDatePicker({ value, onChange }: Props) {
  const router = useRouter();
  const colors = useColors();
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
      DateTimePickerAndroid.open({ value, mode: "date", onChange: handleAndroidChange });
      return;
    }
    setRequest({ value, onChange });
    router.push("/date-picker");
  }, [value, onChange, handleAndroidChange, setRequest, router]);

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
