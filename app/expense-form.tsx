import { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
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
import { IconPicker } from "@/components/expenseForm/IconPicker";
import type { ExpenseIcon } from "@/constants/expenseIcons";
import { addMonths, startOfMonth } from "date-fns";
import {
  formatPayDate,
  getMonthlySlotCount,
  getPaychecks,
  getPaycheckSlotLabel,
  getRepeatMonths,
  hasExtraPaychecks,
  isAlternatePaycheck,
  isRepeatMonth,
  parseLocalDate,
} from "@/utils/payDates";
import { formatMonthShort, formatShortDate } from "@/utils/dates";
import { normalizeLink } from "@/utils/links";
import type { ExpenseKind, LinkSchedule, PaycheckSlot } from "@/types";
import { useProGate } from "@/hooks/useProGate";

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
  const [icon, setIcon] = useState<ExpenseIcon | undefined>(existing?.icon);
  const [goal, setGoal] = useState(existing?.goal ? String(existing.goal) : "");
  const [selectedSourceId, setSelectedSourceId] = useState<string | undefined>(
    existing?.incomeSourceId
  );
  const [linkSchedule, setLinkSchedule] = useState<LinkSchedule>(
    existing?.linkSchedule ?? "every-paycheck"
  );
  const [paycheckSlot, setPaycheckSlot] = useState<PaycheckSlot>(existing?.paycheckOrdinal ?? 0);
  const [repeatStart, setRepeatStart] = useState<string | undefined>(existing?.repeatStart);
  const [paycheck, setPaycheck] = useState<PaycheckChoice | undefined>(() => {
    const assignment = existing ? assignments.find((a) => a.expenseId === existing.id) : undefined;
    return assignment ? { payDate: assignment.payDate, sourceId: assignment.employerId } : undefined;
  });

  const isOneTime = existing ? !existing.isRecurring : false;
  const isSetAside = kind === "set-aside";
  const { locked: setAsideLocked, openPaywall } = useProGate(existing?.kind !== "set-aside");

  const handleChangeKind = useCallback(
    (value: ExpenseKind) => {
      if (value === "set-aside" && setAsideLocked) {
        openPaywall();
      } else {
        setKind(value);
      }
    },
    [setAsideLocked, openPaywall]
  );

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
  // Monthly is every paycheck for a source paid once a month, so that source doesn't offer it
  const schedule: LinkSchedule =
    linkSchedule === "monthly" && slotCount < 2 ? "every-paycheck" : linkSchedule;
  const repeatMonths = getRepeatMonths(schedule);
  const isMonthly = slotCount > 1 && repeatMonths !== undefined;

  // Every other paycheck starts on one of the next two paychecks; every 3, 6 or 12 months in one
  // of the next 3, 6 or 12 months. Together they cover every way the repeat can fall.
  const startOptions = useMemo(() => {
    if (!selectedSource) return [];
    if (schedule === "every-other-paycheck") {
      return getPaychecks(selectedSource, new Date(), 2).map((p) => ({
        value: formatPayDate(p.date),
        label: formatShortDate(p.date),
      }));
    }
    if (repeatMonths === undefined || repeatMonths === 1) return [];
    const thisMonth = startOfMonth(new Date());
    return Array.from({ length: repeatMonths }, (_, i) => {
      const month = addMonths(thisMonth, i);
      return { value: formatPayDate(month), label: formatMonthShort(month) };
    });
    // t changes with the language, which changes the labels
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSource, schedule, repeatMonths, t]);

  // A saved start may lie in the past; pick the option it repeats into
  const effectiveStart = useMemo(() => {
    if (!selectedSource || startOptions.length === 0) return undefined;
    if (!repeatStart) return startOptions[0].value;
    const start = parseLocalDate(repeatStart);
    const match = startOptions.find(({ value }) =>
      schedule === "every-other-paycheck"
        ? isAlternatePaycheck(selectedSource, parseLocalDate(value), start)
        : isRepeatMonth(parseLocalDate(value), repeatMonths ?? 1, start)
    );
    return (match ?? startOptions[0]).value;
  }, [selectedSource, startOptions, repeatStart, schedule, repeatMonths]);

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
    const parsedGoal = goal.trim() ? parseFloat(goal) : undefined;
    if (isSetAside && parsedGoal !== undefined && (isNaN(parsedGoal) || parsedGoal <= 0)) {
      toast.error(t("expenses.form.invalidGoal"));
      return;
    }

    const data = {
      kind: isSetAside ? kind : undefined,
      payee: payee.trim(),
      amount: parsedAmount,
      link: isSetAside ? undefined : normalizeLink(link),
      isRecurring: !isOneTime,
      incomeSourceId: selectedSourceId,
      linkSchedule: selectedSource && schedule !== "every-paycheck" ? schedule : undefined,
      paycheckOrdinal: isMonthly ? effectiveSlot : undefined,
      repeatStart: effectiveStart,
      icon,
      goal: isSetAside ? parsedGoal : undefined,
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
    selectedSource,
    schedule,
    effectiveSlot,
    effectiveStart,
    paycheck,
    icon,
    goal,
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
      { value: "set-aside", label: t("expenses.kind.setAside"), pro: setAsideLocked },
    ],
    [setAsideLocked, t]
  );

  const scheduleOptions = useMemo(() => {
    const options: { value: LinkSchedule; label: string }[] = [
      { value: "every-paycheck", label: t("expenses.form.everyPaycheck") },
      { value: "every-other-paycheck", label: t("expenses.form.everyOtherPaycheck") },
      { value: "monthly", label: t("expenses.form.monthly") },
      { value: "quarterly", label: t("expenses.form.quarterly") },
      { value: "semiannual", label: t("expenses.form.semiannual") },
      { value: "yearly", label: t("expenses.form.yearly") },
    ];
    return slotCount > 1 ? options : options.filter((o) => o.value !== "monthly");
  }, [slotCount, t]);

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
    <KeyboardAwareScrollView
      style={scrollStyle}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      bottomOffset={MEASUREMENTS.keyboardOffset}
    >
      <AppSegmentedControl options={kindOptions} value={kind} onChange={handleChangeKind} />
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

      {isSetAside ? (
        <>
          <AppText variant="section" style={styles.label}>{t("expenses.form.goal")}</AppText>
          <AppInput
            value={goal}
            onChangeText={setGoal}
            placeholder={t("expenses.form.goalPlaceholder")}
            keyboardType="decimal-pad"
          />
          <AppText variant="caption" style={styles.hint}>
            {t("expenses.form.goalHint")}
          </AppText>
        </>
      ) : (
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

      <AppText variant="section" style={styles.label}>{t("expenses.form.icon")}</AppText>
      <IconPicker letter={payee} value={icon} onChange={setIcon} />

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

      {selectedSource && !isOneTime ? (
        <>
          <AppText variant="section" style={styles.label}>{t("expenses.form.howOften")}</AppText>
          <View style={styles.chipRow}>
            {scheduleOptions.map((option) => (
              <AppChip
                key={option.value}
                label={option.label}
                value={option.value}
                selected={schedule === option.value}
                onSelect={setLinkSchedule}
              />
            ))}
          </View>
        </>
      ) : null}

      {startOptions.length > 0 ? (
        <>
          <AppText variant="section" style={styles.label}>
            {t(schedule === "every-other-paycheck" ? "expenses.form.startingWith" : "expenses.form.firstMonth")}
          </AppText>
          <View style={styles.chipRow}>
            {startOptions.map((option) => (
              <AppChip
                key={option.value}
                label={option.label}
                value={option.value}
                selected={effectiveStart === option.value}
                onSelect={setRepeatStart}
              />
            ))}
          </View>
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
  hint: {
    marginTop: MEASUREMENTS.spacing.sm + 2,
  },
  saveButton: {
    marginTop: MEASUREMENTS.spacing.section,
  },
});
