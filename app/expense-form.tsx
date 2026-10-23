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
import { AppSegmentedControl, type SegmentOption } from "@/components/AppSegmentedControl";
import { PaycheckPicker, type PaycheckChoice } from "@/components/expenseForm/PaycheckPicker";
import { getMonthlySlotCount, getPaycheckSlotLabel, hasExtraPaychecks } from "@/utils/payDates";
import { normalizeLink } from "@/utils/links";
import type { LinkSchedule, PaycheckSlot } from "@/types";

const SCHEDULE_OPTIONS: SegmentOption<LinkSchedule>[] = [
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
  const rescheduleExpense = useStore((s) => s.rescheduleExpense);
  const assignments = useStore((s) => s.assignments);

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
  const [paycheckSlot, setPaycheckSlot] = useState<PaycheckSlot>(existing?.paycheckOrdinal ?? 0);
  const [paycheck, setPaycheck] = useState<PaycheckChoice | undefined>(() => {
    const assignment = existing ? assignments.find((a) => a.expenseId === existing.id) : undefined;
    return assignment ? { payDate: assignment.payDate, sourceId: assignment.employerId } : undefined;
  });

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
  const effectiveSlot: PaycheckSlot =
    paycheckSlot === "last" ? "last" : Math.min(paycheckSlot, Math.max(slotCount - 1, 0));
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
      paycheckOrdinal: isMonthly ? effectiveSlot : undefined,
    };

    if (existing) {
      updateExpense(existing.id, data);
      if (isOneTime && paycheck) {
        rescheduleExpense(existing.id, paycheck.payDate, paycheck.sourceId);
      }
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
    effectiveSlot,
    paycheck,
    existing,
    addExpense,
    updateExpense,
    rescheduleExpense,
    router,
  ]);

  const handleSelectSource = useCallback((sourceId: string | undefined) => {
    setSelectedSourceId(sourceId);
  }, []);

  const slotOptions = useMemo<SegmentOption<PaycheckSlot>[]>(() => {
    if (!selectedSource) return [];
    const options: SegmentOption<PaycheckSlot>[] = Array.from(
      { length: slotCount },
      (_, ordinal) => ({
        value: ordinal,
        label: getPaycheckSlotLabel(selectedSource, ordinal, true),
      })
    );
    if (hasExtraPaychecks(selectedSource)) {
      options.push({ value: "last", label: getPaycheckSlotLabel(selectedSource, "last", true) });
    }
    return options;
  }, [selectedSource, slotCount]);

  const slotHint = useMemo(() => {
    if (!selectedSource || !hasExtraPaychecks(selectedSource)) return undefined;
    return effectiveSlot === "last"
      ? "Lands on the final paycheck of each month, including months with an extra one."
      : "Extra paychecks in longer months are skipped. Choose Last to always use the final one.";
  }, [selectedSource, effectiveSlot]);

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
      <AppText variant="section" style={styles.label}>Payee</AppText>
      <AppInput
        value={payee}
        onChangeText={setPayee}
        placeholder="e.g. Electric Company"
      />

      <AppText variant="section" style={styles.label}>Amount</AppText>
      <AppInput
        value={amount}
        onChangeText={setAmount}
        placeholder="e.g. 150.00"
        keyboardType="decimal-pad"
      />

      <AppText variant="section" style={styles.label}>Payment Link (optional)</AppText>
      <AppInput
        value={link}
        onChangeText={setLink}
        placeholder="https://..."
        keyboardType="url"
        autoCapitalize="none"
      />

      {isOneTime && incomeSources.length > 0 ? (
        <>
          <AppText variant="section" style={styles.label}>Paycheck</AppText>
          <PaycheckPicker value={paycheck} onChange={setPaycheck} />
          <AppText variant="caption" style={styles.hint}>
            Move this expense to a different paycheck.
          </AppText>
        </>
      ) : null}

      {incomeSources.length > 0 && !isOneTime ? (
        <>
          <AppText variant="section" style={styles.label}>Linked Income Source</AppText>
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
          <AppText variant="caption" style={styles.hint}>
            When linked, this expense is preloaded on paychecks from that source.
          </AppText>
        </>
      ) : null}

      {slotCount > 1 ? (
        <>
          <AppText variant="section" style={styles.label}>How Often</AppText>
          <AppSegmentedControl
            options={SCHEDULE_OPTIONS}
            value={linkSchedule}
            onChange={setLinkSchedule}
          />
        </>
      ) : null}

      {isMonthly ? (
        <>
          <AppText variant="section" style={styles.label}>Which Paycheck</AppText>
          <AppSegmentedControl
            options={slotOptions}
            value={effectiveSlot}
            onChange={setPaycheckSlot}
          />
          {slotHint ? (
            <AppText variant="caption" style={styles.hint}>
              {slotHint}
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
  hint: {
    marginTop: MEASUREMENTS.spacing.sm + 2,
  },
  saveButton: {
    marginTop: MEASUREMENTS.spacing.section,
  },
});
