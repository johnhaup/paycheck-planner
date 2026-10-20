import { useCallback, useEffect, useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useColors, useIsDark } from "@/hooks/useColors";
import { useDatePickerStore } from "@/stores/datePickerStore";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";

export default function DatePickerScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDark();
  const request = useDatePickerStore((s) => s.request);
  const setRequest = useDatePickerStore((s) => s.setRequest);
  const [tempDate, setTempDate] = useState(() => request?.value ?? new Date());

  const handleChange = useCallback((_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  }, []);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  const handleDone = useCallback(() => {
    request?.onChange(tempDate);
    router.back();
  }, [request, tempDate, router]);

  useEffect(() => () => setRequest(undefined), [setRequest]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleCancel} hitSlop={MEASUREMENTS.hitSlop}>
          <AppText variant="body" color="textSecondary">Cancel</AppText>
        </Pressable>
        <AppText variant="bodyStrong">Select Date</AppText>
        <Pressable onPress={handleDone} hitSlop={MEASUREMENTS.hitSlop}>
          <AppText variant="bodyStrong" color="primaryText">Done</AppText>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: MEASUREMENTS.spacing.xl,
    paddingBottom: MEASUREMENTS.spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: MEASUREMENTS.spacing.gutter,
    paddingBottom: MEASUREMENTS.spacing.base,
  },
  picker: {
    alignSelf: "center",
  },
});
