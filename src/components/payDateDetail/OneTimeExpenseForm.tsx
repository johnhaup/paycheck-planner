import { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useStore } from "@/store";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";

interface Props {
  payDate: string;
  sourceId: string;
}

export function OneTimeExpenseForm({ payDate, sourceId }: Props) {
  const colors = useColors();
  const addExpense = useStore((s) => s.addExpense);
  const assignExpense = useStore((s) => s.assignExpense);
  const [visible, setVisible] = useState(false);
  const [payee, setPayee] = useState("");
  const [amount, setAmount] = useState("");

  const handleShow = useCallback(() => {
    setVisible(true);
  }, []);

  const handleCancel = useCallback(() => {
    setVisible(false);
    setPayee("");
    setAmount("");
  }, []);

  const handleAdd = useCallback(() => {
    if (!payee.trim()) {
      Alert.alert("Error", "Payee name is required.");
      return;
    }
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert("Error", "Enter a valid amount.");
      return;
    }
    const expenseId = addExpense({
      payee: payee.trim(),
      amount: parsed,
      isRecurring: false,
      dueDate: payDate,
    });
    assignExpense(expenseId, payDate, sourceId);
    handleCancel();
  }, [payee, amount, addExpense, assignExpense, payDate, sourceId, handleCancel]);

  const cardStyle = useMemo(
    () => [styles.card, { backgroundColor: colors.cardBackground }],
    [colors]
  );

  if (!visible) {
    return (
      <AppButton
        title="Add One-Time Expense"
        variant="outline"
        onPress={handleShow}
        style={styles.showButton}
      />
    );
  }

  return (
    <View style={cardStyle}>
      <AppText variant="section" style={styles.label}>One-Time Expense</AppText>
      <AppInput value={payee} onChangeText={setPayee} placeholder="Payee" />
      <AppInput
        value={amount}
        onChangeText={setAmount}
        placeholder="Amount"
        keyboardType="decimal-pad"
        style={styles.amountInput}
      />
      <View style={styles.actions}>
        <AppButton
          title="Cancel"
          variant="outline"
          onPress={handleCancel}
          style={styles.actionButton}
        />
        <AppButton title="Add" onPress={handleAdd} style={styles.actionButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  showButton: {
    marginTop: MEASUREMENTS.spacing.lg,
  },
  card: {
    borderRadius: MEASUREMENTS.radius.lg,
    padding: MEASUREMENTS.spacing.lg,
    marginTop: MEASUREMENTS.spacing.lg,
  },
  label: {
    marginBottom: MEASUREMENTS.spacing.md,
  },
  amountInput: {
    marginTop: MEASUREMENTS.spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: MEASUREMENTS.spacing.md,
    marginTop: MEASUREMENTS.spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
});
