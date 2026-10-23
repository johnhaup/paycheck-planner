import {
  addWeeks,
  addMonths,
  setDate,
  startOfDay,
  isBefore,
  isEqual,
  format,
  getDay,
  subDays,
} from "date-fns";
import type { Expense, IncomeSource, PaycheckSlot } from "@/types";

export interface Paycheck {
  date: Date;
  /** 0-based position of this paycheck within its month (see getMonthlySlotCount) */
  ordinal: number;
  /** True for the final paycheck of its month, including an extra 3rd/5th one */
  isLast: boolean;
}

/** Parse a YYYY-MM-DD string as local midnight (not UTC). */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Generate upcoming paychecks for an income source within a date range.
 */
export function getPaychecks(
  source: IncomeSource,
  from: Date,
  count: number
): Paycheck[] {
  const paychecks: Paycheck[] = [];
  const anchor = startOfDay(parseLocalDate(source.firstPayDate));
  const start = startOfDay(from);

  if (source.payFrequency === "semi-monthly") {
    const days = getSemiMonthlyDays(source);
    let current = startOfDay(new Date(start.getFullYear(), start.getMonth(), 1));

    while (paychecks.length < count) {
      // Ordinal follows the scheduled day, so a weekend shift into the previous
      // month doesn't change which "slot" the paycheck fills.
      for (const [ordinal, day] of days.entries()) {
        const nominal = setDate(current, Math.min(day, daysInMonth(current)));
        const adjusted = source.adjustToWorkday ? shiftToFriday(nominal) : nominal;
        if ((isEqual(adjusted, start) || isBefore(start, adjusted)) && paychecks.length < count) {
          paychecks.push({ date: adjusted, ordinal, isLast: ordinal === days.length - 1 });
        }
      }
      current = addMonths(current, 1);
    }
    return paychecks;
  }

  if (source.payFrequency === "monthly") {
    // Clamp per month so an anchor on the 31st pays on the last day of shorter
    // months instead of overflowing into the next one.
    let month = new Date(start.getFullYear(), start.getMonth(), 1);
    while (paychecks.length < count) {
      const date = setDate(month, Math.min(anchor.getDate(), daysInMonth(month)));
      if (!isBefore(date, start)) {
        paychecks.push({ date, ordinal: 0, isLast: true });
      }
      month = addMonths(month, 1);
    }
    return paychecks;
  }

  // weekly or biweekly
  const weekStep = source.payFrequency === "weekly" ? 1 : 2;
  let current = anchor;

  // Advance to the first pay date on or after `start`
  while (isBefore(current, start)) {
    current = addWeeks(current, weekStep);
  }

  while (paychecks.length < count) {
    const next = addWeeks(current, weekStep);
    paychecks.push({
      date: current,
      ordinal: Math.floor((current.getDate() - 1) / (7 * weekStep)),
      isLast: next.getMonth() !== current.getMonth(),
    });
    current = next;
  }

  return paychecks;
}

/** Find the paycheck on a specific pay date (YYYY-MM-DD) for an income source. */
export function getPaycheck(source: IncomeSource, payDate: string): Paycheck | undefined {
  const target = parseLocalDate(payDate);
  return getPaychecks(source, subDays(target, 7), 4).find((p) => isEqual(p.date, target));
}

/** Weekly and bi-weekly months sometimes hold an extra paycheck. */
export function hasExtraPaychecks(source: IncomeSource): boolean {
  return source.payFrequency === "weekly" || source.payFrequency === "biweekly";
}

/**
 * Number of paychecks every month is guaranteed to have. Extra paychecks in
 * longer months (a 3rd biweekly or 5th weekly check) are only reachable via
 * the "last" slot.
 */
export function getMonthlySlotCount(source: IncomeSource): number {
  switch (source.payFrequency) {
    case "weekly":
      return 4;
    case "biweekly":
    case "semi-monthly":
      return 2;
    case "monthly":
      return 1;
  }
}

/** "15th" for semi-monthly slots, else "2nd paycheck" ("2nd" when `short`); "Last paycheck" ("Last"). */
export function getPaycheckSlotLabel(source: IncomeSource, slot: PaycheckSlot, short = false): string {
  if (slot === "last") return short ? "Last" : "Last paycheck";
  if (source.payFrequency === "semi-monthly") {
    return formatOrdinal(getSemiMonthlyDays(source)[slot] ?? slot + 1);
  }
  return short ? formatOrdinal(slot + 1) : `${formatOrdinal(slot + 1)} paycheck`;
}

/** The monthly paycheck slot a linked expense targets, or undefined if it lands on every paycheck. */
export function getLinkedSlot(expense: Expense, source: IncomeSource): PaycheckSlot | undefined {
  const slotCount = getMonthlySlotCount(source);
  if (expense.linkSchedule !== "monthly" || slotCount < 2) return undefined;
  const slot = expense.paycheckOrdinal ?? 0;
  if (slot === "last") return slot;
  // Clamp in case the source's frequency changed to one with fewer paychecks
  return Math.min(slot, slotCount - 1);
}

export function isExpenseLinkedToPaycheck(
  expense: Expense,
  sourceId: string,
  paycheck: Paycheck | undefined,
  source: IncomeSource | undefined
): boolean {
  if (expense.incomeSourceId !== sourceId || !source) return false;
  const target = getLinkedSlot(expense, source);
  if (target === undefined) return true;
  if (!paycheck) return false;
  return target === "last" ? paycheck.isLast : target === paycheck.ordinal;
}

/** Average paychecks per month, for monthly totals. */
export function getPaychecksPerMonth(source: IncomeSource): number {
  switch (source.payFrequency) {
    case "weekly":
      return 52 / 12;
    case "biweekly":
      return 26 / 12;
    case "semi-monthly":
      return 2;
    case "monthly":
      return 1;
  }
}

/** "Semi-monthly · 15th & 30th", "Bi-weekly · Fridays", "Monthly · 2nd" */
export function describePaySchedule(source: IncomeSource): string {
  const anchor = parseLocalDate(source.firstPayDate);
  switch (source.payFrequency) {
    case "weekly":
      return `Weekly · ${format(anchor, "EEEE")}s`;
    case "biweekly":
      return `Bi-weekly · ${format(anchor, "EEEE")}s`;
    case "semi-monthly": {
      const [first, second] = getSemiMonthlyDays(source);
      return `Semi-monthly · ${formatOrdinal(first)} & ${formatOrdinal(second)}`;
    }
    case "monthly":
      return `Monthly · ${formatOrdinal(anchor.getDate())}`;
  }
}

function getSemiMonthlyDays(source: IncomeSource): number[] {
  return [...(source.semiMonthlyDays ?? [1, 15])].sort((a, b) => a - b);
}

function formatOrdinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/** If the date falls on Saturday (6) or Sunday (0), shift to the preceding Friday. */
function shiftToFriday(date: Date): Date {
  const day = getDay(date);
  if (day === 6) return subDays(date, 1);
  if (day === 0) return subDays(date, 2);
  return date;
}

function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function formatPayDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}
