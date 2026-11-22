import { useState, useCallback, useMemo, useRef } from "react";
import { View, StyleSheet, type TextInputInstance } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useStore } from "@/store";
import { useGutters } from "@/hooks/useGutters";
import { SafeAreaProvider } from "react-native-safe-area-context";
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
import { hapticSuccess, hapticWarning } from "@/utils/haptics";

type Field = "payee" | "amount" | "goal" | "dueDay";

// A modal reads its own safe area: iPhone Duo centres it clear of the status column when unfolded
export default function ExpenseFormScreen() {
  return (
    <SafeAreaProvider>
      <ExpenseForm />
    </SafeAreaProvider>
  );
}

function ExpenseForm() {
  const router = useRouter();
  const colors = useColors();
  const gutters = useGutters();
  const contentStyle = useMemo(() => [styles.content, gutters], [gutters]);
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
  // A due-day bill saved before HAU-417 lost its schedule; it was monthly, so clearing the day keeps it monthly
  const [linkSchedule, setLinkSchedule] = useState<LinkSchedule>(
    existing?.linkSchedule ?? (existing?.dueDay !== undefined ? "monthly" : "every-paycheck")
  );
  const [paycheckSlot, setPaycheckSlot] = useState<PaycheckSlot>(existing?.paycheckOrdinal ?? 0);
  const [repeatStart, setRepeatStart] = useState<string | undefined>(existing?.repeatStart);
  const [dueDay, setDueDay] = useState(existing?.dueDay ? String(existing.dueDay) : "");
  const [paycheck, setPaycheck] = useState<PaycheckChoice | undefined>(() => {
    const assignment = existing ? assignments.find((a) => a.expenseId === existing.id) : undefined;
    return assignment ? { payDate: assignment.payDate, sourceId: assignment.employerId } : undefined;
  });

  // Errors sit under their field: a toast covered the sheet's title and close button (HAU-700)
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
  // Linked recurring bills can carry a due day, which picks the paycheck in place of the schedule
  const canHaveDueDay = !isOneTime && !isSetAside && !!selectedSource;
  const hasDueDay = canHaveDueDay && dueDay.trim() !== "";

  // A due day picks the paycheck within a month, so with one the schedule goes by month. Without
  // one, Monthly is every paycheck for a source paid once a month, so that source doesn't offer it.
  const schedule: LinkSchedule = hasDueDay
    ? getRepeatMonths(linkSchedule) === undefined
      ? "monthly"
      : linkSchedule
    : linkSchedule === "monthly" && slotCount < 2
      ? "every-paycheck"
      : linkSchedule;
  const repeatMonths = getRepeatMonths(schedule);
  const isMonthly = !hasDueDay && slotCount > 1 && repeatMonths !== undefined;
  // Saved under a due day too (the due day wins while set), so clearing it brings the old schedule
  // and paycheck back instead of every paycheck (HAU-417)
  const savedSchedule: LinkSchedule = hasDueDay ? linkSchedule : schedule;
  const keepsSlot = slotCount > 1 && getRepeatMonths(savedSchedule) !== undefined;

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
      refuse("payee", t(isSetAside ? "expenses.form.nameRequired" : "expenses.form.payeeRequired"));
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      refuse("amount", t("expenses.form.invalidAmount"));
      return;
    }
    const parsedGoal = goal.trim() ? parseFloat(goal) : undefined;
    if (isSetAside && parsedGoal !== undefined && (isNaN(parsedGoal) || parsedGoal <= 0)) {
      refuse("goal", t("expenses.form.invalidGoal"));
      return;
    }

    const parsedDueDay = hasDueDay ? Number(dueDay.trim()) : undefined;
    if (parsedDueDay !== undefined && !(Number.isInteger(parsedDueDay) && parsedDueDay >= 1 && parsedDueDay <= 31)) {
      refuse("dueDay", t("expenses.form.dueDayRange"));
      return;
    }

    const data = {
      kind: isSetAside ? kind : undefined,
      payee: payee.trim(),
      amount: parsedAmount,
      link: isSetAside ? undefined : normalizeLink(link),
      isRecurring: !isOneTime,
      incomeSourceId: selectedSourceId,
      // Every paycheck is written out under a due day: a due day with no schedule is a pre-HAU-417 bill
      linkSchedule:
        selectedSource && (hasDueDay || savedSchedule !== "every-paycheck") ? savedSchedule : undefined,
      paycheckOrdinal: keepsSlot ? effectiveSlot : undefined,
      repeatStart: effectiveStart ?? (hasDueDay ? repeatStart : undefined),
      dueDay: parsedDueDay,
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
    hapticSuccess();
    router.back();
  }, [
    isSetAside,
    kind,
    payee,
    amount,
    link,
    selectedSourceId,
    isOneTime,
    selectedSource,
    savedSchedule,
    keepsSlot,
    effectiveSlot,
    effectiveStart,
    repeatStart,
    hasDueDay,
    dueDay,
    paycheck,
    icon,
    goal,
    existing,
    addExpense,
    updateExpense,
    rescheduleExpense,
    router,
    refuse,
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
    if (hasDueDay) return options.filter((o) => getRepeatMonths(o.value) !== undefined);
    return slotCount > 1 ? options : options.filter((o) => o.value !== "monthly");
  }, [hasDueDay, slotCount, t]);

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
      contentContainerStyle={contentStyle}
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
        ref={(el) => { inputRefs.current.payee = el; }}
        value={payee}
        onChangeText={editField("payee", setPayee)}
        error={fieldError("payee")}
        placeholder={t(isSetAside ? "expenses.form.setAsidePlaceholder" : "expenses.form.payeePlaceholder")}
      />

      <AppText variant="section" style={styles.label}>{t("expenses.form.amount")}</AppText>
      <AppInput
        ref={(el) => { inputRefs.current.amount = el; }}
        value={amount}
        onChangeText={editField("amount", setAmount)}
        error={fieldError("amount")}
        placeholder={t("expenses.form.amountPlaceholder")}
        keyboardType="decimal-pad"
      />

      {isSetAside ? (
        <>
          <AppText variant="section" style={styles.label}>{t("expenses.form.goal")}</AppText>
          <AppInput
            ref={(el) => { inputRefs.current.goal = el; }}
            value={goal}
            onChangeText={editField("goal", setGoal)}
            error={fieldError("goal")}
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

      {canHaveDueDay ? (
        <>
          <AppText variant="section" style={styles.label}>{t("expenses.form.dueDay")}</AppText>
          <AppInput
            ref={(el) => { inputRefs.current.dueDay = el; }}
            value={dueDay}
            onChangeText={editField("dueDay", setDueDay)}
            error={fieldError("dueDay")}
            placeholder={t("expenses.form.dueDayPlaceholder")}
            keyboardType="number-pad"
            maxLength={2}
          />
          <AppText variant="caption" style={styles.hint}>
            {t("expenses.form.dueDayHint")}
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

      {isMonthly && !hasDueDay ? (
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
