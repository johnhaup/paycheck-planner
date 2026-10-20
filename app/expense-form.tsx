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
      link: link.trim() || undefined,
      isRecurring: true,
      incomeSourceId: selectedSourceId,
    };

    if (existing) {
      updateExpense(existing.id, data);
    } else {
      addExpense(data);
    }
    router.back();
  }, [payee, amount, link, selectedSourceId, existing, addExpense, updateExpense, router]);

  const handleSelectSource = useCallback((sourceId: string | undefined) => {
    setSelectedSourceId(sourceId);
  }, []);

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

      {incomeSources.length > 0 ? (
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
            When linked, this expense is preloaded on every paycheck from that source.
          </AppText>
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
