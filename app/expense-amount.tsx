import { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { format } from "date-fns";
import { useStore } from "@/store";
import { useColors } from "@/hooks/useColors";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppInput } from "@/components/AppInput";
import { AppButton } from "@/components/AppButton";
import { parseLocalDate } from "@/utils/payDates";

export default function ExpenseAmountScreen() {
  const router = useRouter();
  const colors = useColors();
  const { format: formatMoney } = useMoneyFormat();
  const { expenseId, payDate, sourceId } = useLocalSearchParams<{
    expenseId: string;
    payDate: string;
    sourceId: string;
  }>();
  const expense = useStore((s) => s.expenses.find((e) => e.id === expenseId));
  const assignment = useStore((s) =>
    s.assignments.find(
      (a) => a.expenseId === expenseId && a.payDate === payDate && a.employerId === sourceId
    )
  );
  const assignExpense = useStore((s) => s.assignExpense);
  const setAssignmentAmount = useStore((s) => s.setAssignmentAmount);
  const [amount, setAmount] = useState(() =>
    String(assignment?.amount ?? expense?.amount ?? "")
  );

  const handleSave = useCallback(() => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed < 0) {
      Alert.alert("Error", "Enter a valid amount.");
      return;
    }
    // Linked bills have no assignment until something on this paycheck is changed
    const id = assignment?.id || assignExpense(expenseId, payDate, sourceId);
    setAssignmentAmount(id, parsed === expense?.amount ? undefined : parsed);
    router.back();
  }, [amount, assignment, assignExpense, expenseId, payDate, sourceId, setAssignmentAmount, expense, router]);

  const handleReset = useCallback(() => {
    if (assignment) {
      setAssignmentAmount(assignment.id, undefined);
    }
    router.back();
  }, [assignment, setAssignmentAmount, router]);

  const containerStyle = useMemo(
    () => [styles.container, { backgroundColor: colors.modalBackground }],
    [colors]
  );

  const subtitle = payDate ? `${format(parseLocalDate(payDate), "EEE, MMM d")} paycheck only` : "";
  const isCustom = assignment?.amount !== undefined;

  return (
    <View style={containerStyle}>
      <View style={styles.heading}>
        <AppText variant="title">{expense?.payee ?? "Expense"}</AppText>
        <AppText variant="meta">{subtitle}</AppText>
      </View>
      <AppInput
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        autoFocus
        selectTextOnFocus
      />
      <AppText variant="caption" style={styles.hint}>
        Default is {formatMoney(expense?.amount ?? 0)}. Other paychecks keep the default.
      </AppText>
      <View style={styles.actions}>
        <AppButton title="Save" onPress={handleSave} />
        {isCustom ? (
          <AppButton title="Use default amount" variant="outline" onPress={handleReset} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: MEASUREMENTS.spacing.gutter,
    paddingTop: MEASUREMENTS.spacing.xxl,
  },
  heading: {
    gap: MEASUREMENTS.spacing.xs,
    marginBottom: MEASUREMENTS.spacing.lg,
  },
  hint: {
    marginTop: MEASUREMENTS.spacing.sm + 2,
  },
  actions: {
    gap: MEASUREMENTS.spacing.md,
    marginTop: MEASUREMENTS.spacing.xl,
  },
});
