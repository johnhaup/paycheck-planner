import { useState, useCallback, useMemo, useRef } from "react";
import { View, StyleSheet, type TextInputInstance } from "react-native";
import { KeyboardAwareScrollView, type KeyboardAwareScrollViewRef } from "react-native-keyboard-controller";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useStore } from "@/store";
import { useGutters } from "@/hooks/useGutters";
import { useBottomPadding } from "@/hooks/useBottomPadding";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/hooks/useLocale";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppInput } from "@/components/AppInput";
import { AppButton } from "@/components/AppButton";
import { AppChip } from "@/components/AppChip";
import { AppDatePicker } from "@/components/AppDatePicker";
import { AppToggle } from "@/components/AppToggle";
import { AppFormSection } from "@/components/AppFormSection";
import { LayoutAnimationConfig } from "react-native-reanimated";
import { formatPayDate, parseLocalDate } from "@/utils/payDates";
import type { PayFrequency } from "@/types";
import { hapticSuccess, hapticWarning } from "@/utils/haptics";
import { useScrollKeptOnResize } from "@/hooks/useScrollKeptOnResize";

type Field = "name" | "payAmount" | "semiDay1" | "semiDay2";

// A modal reads its own safe area: iPhone Duo centres it clear of the status column when unfolded
export default function IncomeFormScreen() {
  return (
    <SafeAreaProvider>
      <IncomeForm />
    </SafeAreaProvider>
  );
}

function IncomeForm() {
  const router = useRouter();
  const colors = useColors();
  const scrollRef = useRef<KeyboardAwareScrollViewRef>(null);
  const keptScroll = useScrollKeptOnResize(scrollRef);
  const gutters = useGutters();
  const bottomPadding = useBottomPadding();
  const contentStyle = useMemo(() => [styles.content, gutters, bottomPadding], [gutters, bottomPadding]);
  const t = useT();
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

  // Errors sit under their field: a toast covered the sheet's title and X (HAU-772, as HAU-700)
  const [error, setError] = useState<{ field: Field; message: string } | undefined>();
  const inputRefs = useRef<Partial<Record<Field, TextInputInstance | null>>>({});
  const fieldError = (field: Field) => (error?.field === field ? error.message : undefined);
  const refuse = useCallback((field: Field, message: string) => {
    hapticWarning();
    setError({ field, message });
    // Focusing scrolls the field into view above the keyboard
    inputRefs.current[field]?.focus();
  }, []);
  const editField = useCallback(
    (field: Field, set: (value: string) => void) => (value: string) => {
      set(value);
      setError((current) => (current?.field === field ? undefined : current));
    },
    []
  );

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      refuse("name", t("income.form.nameRequired"));
      return;
    }
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) {
      refuse("payAmount", t("income.form.invalidAmount"));
      return;
    }
    const day1 = Number(semiDay1);
    const day2 = Number(semiDay2);
    const semiMonthlyDays: [number, number] = [day1, day2];
    const validDay = (d: number) => Number.isInteger(d) && d >= 1 && d <= 31;
    if (frequency === "semi-monthly" && !(validDay(day1) && validDay(day2))) {
      // The first out-of-range day is the one outlined and focused
      refuse(validDay(day1) ? "semiDay2" : "semiDay1", t("income.form.payDaysRange"));
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
    hapticSuccess();
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
    t,
    refuse,
  ]);

  const frequencies = useMemo<{ value: PayFrequency; label: string }[]>(
    () => [
      { value: "weekly", label: t("income.frequency.weekly") },
      { value: "biweekly", label: t("income.frequency.biweekly") },
      { value: "semi-monthly", label: t("income.frequency.semiMonthly") },
      { value: "monthly", label: t("income.frequency.monthly") },
    ],
    [t]
  );

  const scrollStyle = useMemo(
    () => ({ backgroundColor: colors.modalBackground }),
    [colors]
  );

  return (
    <KeyboardAwareScrollView
      ref={scrollRef}
      {...keptScroll}
      style={scrollStyle}
      contentContainerStyle={contentStyle}
      keyboardShouldPersistTaps="handled"
      bottomOffset={MEASUREMENTS.keyboardOffset}
    >
      <LayoutAnimationConfig skipEntering>
        <AppText variant="section" style={styles.label}>{t("income.form.name")}</AppText>
        <AppInput
          ref={(el) => { inputRefs.current.name = el; }}
          value={name}
          onChangeText={editField("name", setName)}
          error={fieldError("name")}
          placeholder={t("income.form.namePlaceholder")}
        />

        <AppText variant="section" style={styles.label}>{t("income.form.payAmount")}</AppText>
        <AppInput
          ref={(el) => { inputRefs.current.payAmount = el; }}
          value={payAmount}
          onChangeText={editField("payAmount", setPayAmount)}
          error={fieldError("payAmount")}
          placeholder={t("income.form.payAmountPlaceholder")}
          keyboardType="decimal-pad"
        />

        <AppText variant="section" style={styles.label}>{t("income.form.payFrequency")}</AppText>
        <View style={styles.chipRow}>
          {frequencies.map((f) => (
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
          <AppFormSection key="semi-monthly">
            <AppText variant="section" style={styles.label}>{t("income.form.payDays")}</AppText>
            <View style={styles.semiRow}>
              <AppInput
                style={styles.semiInput}
                ref={(el) => { inputRefs.current.semiDay1 = el; }}
                value={semiDay1}
                onChangeText={editField("semiDay1", setSemiDay1)}
                invalid={error?.field === "semiDay1"}
                placeholder="1"
                keyboardType="number-pad"
              />
              <AppText variant="meta">{t("common.and")}</AppText>
              <AppInput
                style={styles.semiInput}
                ref={(el) => { inputRefs.current.semiDay2 = el; }}
                value={semiDay2}
                onChangeText={editField("semiDay2", setSemiDay2)}
                invalid={error?.field === "semiDay2"}
                placeholder="15"
                keyboardType="number-pad"
              />
            </View>
            {error?.field === "semiDay1" || error?.field === "semiDay2" ? (
              <AppText
                variant="caption"
                color="destructive"
                style={styles.hint}
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
              >
                {error.message}
              </AppText>
            ) : null}
            <AppText variant="caption" style={styles.hint}>
              {t("income.form.payDaysHint")}
            </AppText>

            <View style={styles.toggleRow}>
              <AppText variant="body">{t("income.form.adjustToWorkday")}</AppText>
              <AppToggle value={adjustToWorkday} onValueChange={setAdjustToWorkday} />
            </View>
            <AppText variant="caption" style={styles.toggleHint}>
              {t("income.form.adjustHint")}
            </AppText>
          </AppFormSection>
        ) : (
          <AppFormSection key="first-pay-date">
            <AppText variant="section" style={styles.label}>{t("income.form.firstPayDate")}</AppText>
            <AppDatePicker value={firstPayDate} onChange={setFirstPayDate} />
          </AppFormSection>
        )}

        <AppFormSection>
          <AppButton
            title={existing ? t("income.form.updateButton") : t("income.form.addButton")}
            onPress={handleSave}
            style={styles.saveButton}
          />
        </AppFormSection>
      </LayoutAnimationConfig>
    </KeyboardAwareScrollView>
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
