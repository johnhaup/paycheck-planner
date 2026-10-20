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
import { getMonthlySlotCount, getPaycheckSlotLabel } from "@/utils/payDates";
import { normalizeLink } from "@/utils/links";
import type { LinkSchedule } from "@/types";

const SCHEDULE_OPTIONS: { value: LinkSchedule; label: string }[] = [
  { value: "every-paycheck", label: "Every paycheck" },
  { value: "monthly", label: "Monthly" },
];

export default function ExpenseFormScreen() {
  const router = useRouter();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const expenses = useStore((s) => s.expenses);
  const incomeSources = useStore((s) => s.incomeSources);
  const addExpense = useStore((s) => s.addExpense);
  const updateExpense = useStore((s) => s.updateExpense);

  const existing = useMemo(
    () => (id ? expenses.find((e) => e.id === id) : undefined),
    [id, expenses]
  );

  const [payee, setPayee] = useState(existing?.payee ?? "");
  const [amount, setAmount] = useState(
    existing ? String(existing.amount) : ""
  );
  const [link, setLink] = useState(existing?.link ?? "");
  const [selectedSourceId, setSelectedSourceId] = useState<string | undefined>(
    existing?.incomeSourceId
  );
  const [linkSchedule, setLinkSchedule] = useState<LinkSchedule>(
    existing?.linkSchedule ?? "every-paycheck"
  );
  const [paycheckOrdinal, setPaycheckOrdinal] = useState(existing?.paycheckOrdinal ?? 0);

  const isOneTime = existing ? !existing.isRecurring : false;

  const selectedSource = useMemo(
    () => incomeSources.find((s) => s.id === selectedSourceId),
    [incomeSources, selectedSourceId]
  );

  const slotCount = useMemo(
    () => (selectedSource ? getMonthlySlotCount(selectedSource) : 0),
    [selectedSource]
  );

  // Switching to a source with fewer paychecks per month clamps the choice
  const effectiveOrdinal = Math.min(paycheckOrdinal, Math.max(slotCount - 1, 0));
  const isMonthly = slotCount > 1 && linkSchedule === "monthly";

  const handleSave = useCallback(() => {
    if (!payee.trim()) {
      Alert.alert("Error", "Payee name is required.");
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Error", "Enter a valid amount.");
      return;
    }

    const data = {
      payee: payee.trim(),
      amount: parsedAmount,
      link: normalizeLink(link),
      isRecurring: !isOneTime,
      incomeSourceId: selectedSourceId,
      linkSchedule: isMonthly ? linkSchedule : undefined,
      paycheckOrdinal: isMonthly ? effectiveOrdinal : undefined,
    };

    if (existing) {
      updateExpense(existing.id, data);
    } else {
      addExpense(data);
    }
    router.back();
  }, [
    payee,
    amount,
    link,
    selectedSourceId,
    isOneTime,
    isMonthly,
    linkSchedule,
    effectiveOrdinal,
    existing,
    addExpense,
    updateExpense,
    router,
  ]);

  const handleSelectSource = useCallback((sourceId: string | undefined) => {
    setSelectedSourceId(sourceId);
  }, []);

  const ordinalOptions = useMemo(
    () =>
      selectedSource
        ? Array.from({ length: slotCount }, (_, ordinal) => ({
            value: ordinal,
            label: getPaycheckSlotLabel(selectedSource, ordinal),
          }))
        : [],
    [selectedSource, slotCount]
  );

  const scrollStyle = useMemo(
    () => ({ backgroundColor: colors.screenBackground }),
    [colors]
  );

  return (
    <ScrollView
      style={scrollStyle}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <AppText variant="label" style={styles.label}>Payee</AppText>
      <AppInput
        value={payee}
        onChangeText={setPayee}
        placeholder="e.g. Electric Company"
      />

      <AppText variant="label" style={styles.label}>Amount</AppText>
      <AppInput
        value={amount}
        onChangeText={setAmount}
        placeholder="e.g. 150.00"
        keyboardType="decimal-pad"
      />

      <AppText variant="label" style={styles.label}>Payment Link (optional)</AppText>
      <AppInput
        value={link}
        onChangeText={setLink}
        placeholder="https://..."
        keyboardType="url"
        autoCapitalize="none"
      />

      {incomeSources.length > 0 && !isOneTime ? (
        <>
          <AppText variant="label" style={styles.label}>Linked Income Source</AppText>
          <View style={styles.chipRow}>
            <AppChip
              label="None"
              value={undefined}
              selected={!selectedSourceId}
              onSelect={handleSelectSource}
            />
            {incomeSources.map((source) => (
              <AppChip
                key={source.id}
                label={source.name}
                value={source.id}
                selected={selectedSourceId === source.id}
                onSelect={handleSelectSource}
              />
            ))}
          </View>
          <AppText variant="caption" color="textMuted" style={styles.hint}>
            When linked, this expense is preloaded on paychecks from that source.
          </AppText>
        </>
      ) : null}

      {slotCount > 1 ? (
        <>
          <AppText variant="label" style={styles.label}>How Often</AppText>
          <View style={styles.chipRow}>
            {SCHEDULE_OPTIONS.map((option) => (
              <AppChip
                key={option.value}
                label={option.label}
                value={option.value}
                selected={linkSchedule === option.value}
                onSelect={setLinkSchedule}
              />
            ))}
          </View>
        </>
      ) : null}

      {isMonthly ? (
        <>
          <AppText variant="label" style={styles.label}>Which Paycheck</AppText>
          <View style={styles.chipRow}>
            {ordinalOptions.map((option) => (
              <AppChip
                key={option.value}
                label={option.label}
                value={option.value}
                selected={effectiveOrdinal === option.value}
                onSelect={setPaycheckOrdinal}
              />
            ))}
          </View>
          {selectedSource?.payFrequency !== "semi-monthly" ? (
            <AppText variant="caption" color="textMuted" style={styles.hint}>
              Extra paychecks in longer months are skipped.
            </AppText>
          ) : null}
        </>
      ) : null}

      <AppButton
        title={`${existing ? "Update" : "Add"} Expense`}
        onPress={handleSave}
        style={styles.saveButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: MEASUREMENTS.spacing.lg,
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
  hint: {
    marginTop: MEASUREMENTS.spacing.sm + 2,
  },
  saveButton: {
    marginTop: MEASUREMENTS.spacing.section,
  },
});
