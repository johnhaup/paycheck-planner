import { useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useStore } from "@/store";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppChip } from "@/components/AppChip";
import { formatPayDate, getPaychecks, parseLocalDate } from "@/utils/payDates";
import { formatShortDate } from "@/utils/dates";
import { useT } from "@/hooks/useLocale";
import type { IncomeSource, PaycheckRef } from "@/types";

const UPCOMING_COUNT = 8;
const KEY_SEPARATOR = "|";

export type PaycheckChoice = PaycheckRef;

interface Props {
  value?: PaycheckChoice;
  /** Left out of the options, e.g. the paycheck a bill is being moved from */
  exclude?: PaycheckChoice;
  onChange: (choice: PaycheckChoice) => void;
}

function toKey(choice: PaycheckChoice) {
  return `${choice.sourceId}${KEY_SEPARATOR}${choice.payDate}`;
}

/** The next few paychecks across every source, soonest first. */
export function getUpcomingPaycheckChoices(
  incomeSources: IncomeSource[],
  now: Date,
  exclude?: PaycheckChoice
): PaycheckChoice[] {
  const excludeKey = exclude ? toKey(exclude) : undefined;
  return incomeSources
    .flatMap((source) =>
      getPaychecks(source, now, UPCOMING_COUNT).map(({ date }) => ({
        payDate: formatPayDate(date),
        sourceId: source.id,
      }))
    )
    .filter((choice) => toKey(choice) !== excludeKey)
    .sort((a, b) => a.payDate.localeCompare(b.payDate))
    .slice(0, UPCOMING_COUNT);
}

export function PaycheckPicker({ value, exclude, onChange }: Props) {
  const incomeSources = useStore((s) => s.incomeSources);
  const t = useT();

  const handleSelect = useCallback(
    (key: string) => {
      const [sourceId, payDate] = key.split(KEY_SEPARATOR);
      onChange({ sourceId, payDate });
    },
    [onChange]
  );

  const options = useMemo(() => {
    const choices = getUpcomingPaycheckChoices(incomeSources, new Date(), exclude);
    // Keep the current paycheck selectable even when it's already past
    if (value && !choices.some((c) => toKey(c) === toKey(value))) {
      choices.unshift(value);
    }
    const namesById = new Map(incomeSources.map((s) => [s.id, s.name]));
    return choices.map((choice) => {
      const date = formatShortDate(parseLocalDate(choice.payDate));
      return {
        key: toKey(choice),
        label:
          incomeSources.length > 1
            ? `${date} · ${namesById.get(choice.sourceId) ?? t("common.removed")}`
            : date,
      };
    });
  }, [incomeSources, value, exclude, t]);

  const selectedKey = value ? toKey(value) : undefined;

  return (
    <View style={styles.chipRow}>
      {options.map((option) => (
        <AppChip
          key={option.key}
          label={option.label}
          value={option.key}
          selected={option.key === selectedKey}
          onSelect={handleSelect}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: MEASUREMENTS.spacing.md,
  },
});
