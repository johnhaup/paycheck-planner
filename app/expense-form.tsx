import { useState, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { toast } from "sonner-native";
import { useStore } from "@/store";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/hooks/useLocale";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppInput } from "@/components/AppInput";
import { AppButton } from "@/components/AppButton";
import { AppChip } from "@/components/AppChip";
import { AppSegmentedControl, type SegmentOption } from "@/components/AppSegmentedControl";
import { PaycheckPicker, type PaycheckChoice } from "@/components/expenseForm/PaycheckPicker";
import { getMonthlySlotCount, getPaycheckSlotLabel, hasExtraPaychecks } from "@/utils/payDates";
import { normalizeLink } from "@/utils/links";
import type { ExpenseKind, LinkSchedule, PaycheckSlot } from "@/types";

export default function ExpenseFormScreen() {
  const router = useRouter();
  const colors = useColors();
  const t = useT();
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

  const [kind, setKind] = useState<ExpenseKind>(existing?.kind ?? "bill");
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
  const isSetAside = kind === "set-aside";

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
      toast.error(t(isSetAside ? "expenses.form.nameRequired" : "expenses.form.payeeRequired"));
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error(t("expenses.form.invalidAmount"));
      return;
    }

    const data = {
      kind: isSetAside ? kind : undefined,
      payee: payee.trim(),
      amount: parsedAmount,
      link: isSetAside ? undefined : normalizeLink(link),
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
    isSetAside,
    kind,
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
    t,
  ]);

  const handleSelectSource = useCallback((sourceId: string | undefined) => {
    setSelectedSourceId(sourceId);
  }, []);

  const kindOptions = useMemo<SegmentOption<ExpenseKind>[]>(
    () => [
      { value: "bill", label: t("expenses.kind.bill") },
      { value: "set-aside", label: t("expenses.kind.setAside") },
    ],
    [t]
  );

  const scheduleOptions = useMemo<SegmentOption<LinkSchedule>[]>(
    () => [
      { value: "every-paycheck", label: t("expenses.form.everyPaycheck") },
      { value: "monthly", label: t("expenses.form.monthly") },
    ],
    [t]
  );

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
    // t changes with the language, which changes the slot labels
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSource, slotCount, t]);

  const slotHint = useMemo(() => {
    if (!selectedSource || !hasExtraPaychecks(selectedSource)) return undefined;
    return effectiveSlot === "last"
      ? t("expenses.form.slotHintLast")
      : t("expenses.form.slotHintOrdinal");
  }, [selectedSource, effectiveSlot, t]);

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
      <AppSegmentedControl options={kindOptions} value={kind} onChange={setKind} />
      {isSetAside ? (
        <AppText variant="caption" style={styles.hint}>
          {t("expenses.form.setAsideHint")}
        </AppText>
      ) : null}

      <AppText variant="section" style={styles.label}>
        {t(isSetAside ? "expenses.form.name" : "expenses.form.payee")}
      </AppText>
      <AppInput
        value={payee}
        onChangeText={setPayee}
        placeholder={t(isSetAside ? "expenses.form.setAsidePlaceholder" : "expenses.form.payeePlaceholder")}
      />

      <AppText variant="section" style={styles.label}>{t("expenses.form.amount")}</AppText>
      <AppInput
        value={amount}
        onChangeText={setAmount}
        placeholder={t("expenses.form.amountPlaceholder")}
        keyboardType="decimal-pad"
      />

      {isSetAside ? null : (
        <>
          <AppText variant="section" style={styles.label}>{t("expenses.form.link")}</AppText>
          <AppInput
            value={link}
            onChangeText={setLink}
            placeholder={t("expenses.form.linkPlaceholder")}
            keyboardType="url"
            autoCapitalize="none"
          />
        </>
      )}

      {isOneTime && incomeSources.length > 0 ? (
        <>
          <AppText variant="section" style={styles.label}>{t("expenses.form.paycheck")}</AppText>
          <PaycheckPicker value={paycheck} onChange={setPaycheck} />
          <AppText variant="caption" style={styles.hint}>
            {t("expenses.form.moveHint")}
          </AppText>
        </>
      ) : null}

      {incomeSources.length > 0 && !isOneTime ? (
        <>
          <AppText variant="section" style={styles.label}>{t("expenses.form.linkedSource")}</AppText>
          <View style={styles.chipRow}>
            <AppChip
              label={t("common.none")}
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
            {t("expenses.form.linkedHint")}
          </AppText>
        </>
      ) : null}

      {slotCount > 1 ? (
        <>
          <AppText variant="section" style={styles.label}>{t("expenses.form.howOften")}</AppText>
          <AppSegmentedControl
            options={scheduleOptions}
            value={linkSchedule}
            onChange={setLinkSchedule}
          />
        </>
      ) : null}

      {isMonthly ? (
        <>
          <AppText variant="section" style={styles.label}>{t("expenses.form.whichPaycheck")}</AppText>
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
        title={t(
          existing
            ? isSetAside
              ? "expenses.form.updateSetAside"
              : "expenses.form.updateButton"
            : isSetAside
              ? "expenses.form.addSetAside"
              : "expenses.form.addButton"
        )}
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
