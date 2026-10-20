import { useState, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useStore } from "@/store";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppInput } from "@/components/AppInput";
import { AppButton } from "@/components/AppButton";
import { AppChip } from "@/components/AppChip";
import { AppDatePicker } from "@/components/AppDatePicker";
import { AppToggle } from "@/components/AppToggle";
import { formatPayDate, parseLocalDate } from "@/utils/payDates";
import type { PayFrequency } from "@/types";

const FREQUENCIES: { value: PayFrequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "semi-monthly", label: "Semi-monthly" },
  { value: "monthly", label: "Monthly" },
];

export default function IncomeFormScreen() {
  const router = useRouter();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const incomeSources = useStore((s) => s.incomeSources);
  const addIncomeSource = useStore((s) => s.addIncomeSource);
  const updateIncomeSource = useStore((s) => s.updateIncomeSource);

  const existing = useMemo(
    () => (id ? incomeSources.find((e) => e.id === id) : undefined),
    [id, incomeSources]
  );

  const [name, setName] = useState(existing?.name ?? "");
  const [payAmount, setPayAmount] = useState(
    existing ? String(existing.payAmount) : ""
  );
  const [frequency, setFrequency] = useState<PayFrequency>(
    existing?.payFrequency ?? "biweekly"
  );
  const [firstPayDate, setFirstPayDate] = useState(
    existing?.firstPayDate ? parseLocalDate(existing.firstPayDate) : new Date()
  );
  const [semiDay1, setSemiDay1] = useState(
    existing?.semiMonthlyDays ? String(existing.semiMonthlyDays[0]) : "1"
  );
  const [semiDay2, setSemiDay2] = useState(
    existing?.semiMonthlyDays ? String(existing.semiMonthlyDays[1]) : "15"
  );
  const [adjustToWorkday, setAdjustToWorkday] = useState(
    existing?.adjustToWorkday ?? false
  );

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      Alert.alert("Error", "Name is required.");
      return;
    }
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Enter a valid pay amount.");
      return;
    }
    const day1 = Number(semiDay1);
    const day2 = Number(semiDay2);
    const semiMonthlyDays: [number, number] = [day1, day2];
    if (
      frequency === "semi-monthly" &&
      !semiMonthlyDays.every((d) => Number.isInteger(d) && d >= 1 && d <= 31)
    ) {
      Alert.alert("Error", "Pay days must be between 1 and 31.");
      return;
    }

    const data = {
      name: name.trim(),
      payAmount: amount,
      payFrequency: frequency,
      firstPayDate: formatPayDate(frequency === "semi-monthly" ? new Date() : firstPayDate),
      semiMonthlyDays:
        frequency === "semi-monthly" ? semiMonthlyDays : undefined,
      adjustToWorkday:
        frequency === "semi-monthly" ? adjustToWorkday : undefined,
    };

    if (existing) {
      updateIncomeSource(existing.id, data);
    } else {
      addIncomeSource(data);
    }
    router.back();
  }, [
    name,
    payAmount,
    frequency,
    firstPayDate,
    semiDay1,
    semiDay2,
    adjustToWorkday,
    existing,
    addIncomeSource,
    updateIncomeSource,
    router,
  ]);

  const scrollStyle = useMemo(
    () => ({ backgroundColor: colors.modalBackground }),
    [colors]
  );

  return (
    <ScrollView
      style={scrollStyle}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <AppText variant="section" style={styles.label}>Name</AppText>
      <AppInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Acme Corp"
      />

      <AppText variant="section" style={styles.label}>Pay Amount (per check)</AppText>
      <AppInput
        value={payAmount}
        onChangeText={setPayAmount}
        placeholder="e.g. 2500.00"
        keyboardType="decimal-pad"
      />

      <AppText variant="section" style={styles.label}>Pay Frequency</AppText>
      <View style={styles.chipRow}>
        {FREQUENCIES.map((f) => (
          <AppChip
            key={f.value}
            label={f.label}
            value={f.value}
            selected={frequency === f.value}
            onSelect={setFrequency}
          />
        ))}
      </View>

      {frequency === "semi-monthly" ? (
        <>
          <AppText variant="section" style={styles.label}>Pay Days of Month</AppText>
          <View style={styles.semiRow}>
            <AppInput
              style={styles.semiInput}
              value={semiDay1}
              onChangeText={setSemiDay1}
              placeholder="1"
              keyboardType="number-pad"
            />
            <AppText variant="meta">and</AppText>
            <AppInput
              style={styles.semiInput}
              value={semiDay2}
              onChangeText={setSemiDay2}
              placeholder="15"
              keyboardType="number-pad"
            />
          </View>
          <AppText variant="caption" style={styles.hint}>
            Use 31 for last day of month (auto-adjusts for shorter months)
          </AppText>

          <View style={styles.toggleRow}>
            <AppText variant="body">Adjust to workday</AppText>
            <AppToggle value={adjustToWorkday} onValueChange={setAdjustToWorkday} />
          </View>
          <AppText variant="caption" style={styles.toggleHint}>
            If a pay date falls on a weekend, it shifts to the preceding Friday.
          </AppText>
        </>
      ) : (
        <>
          <AppText variant="section" style={styles.label}>First Pay Date</AppText>
          <AppDatePicker value={firstPayDate} onChange={setFirstPayDate} />
        </>
      )}

      <AppButton
        title={`${existing ? "Update" : "Add"} Income Source`}
        onPress={handleSave}
        style={styles.saveButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: MEASUREMENTS.spacing.gutter,
    paddingBottom: MEASUREMENTS.spacing.bottom,
  },
  label: {
    marginBottom: MEASUREMENTS.spacing.sm + 2,
    marginTop: MEASUREMENTS.spacing.lg,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: MEASUREMENTS.spacing.md,
  },
  semiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.md + 2,
  },
  semiInput: {
    flex: 1,
  },
  hint: {
    marginTop: MEASUREMENTS.spacing.sm + 2,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: MEASUREMENTS.spacing.lg,
  },
  toggleHint: {
    marginTop: MEASUREMENTS.spacing.sm,
  },
  saveButton: {
    marginTop: MEASUREMENTS.spacing.section,
  },
});
