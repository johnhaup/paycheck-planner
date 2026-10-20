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
import type { Expense, IncomeSource } from "@/types";

export interface Paycheck {
  date: Date;
  /** 0-based position of this paycheck within its month (see getMonthlySlotCount) */
  ordinal: number;
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
          paychecks.push({ date: adjusted, ordinal });
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
        paychecks.push({ date, ordinal: 0 });
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
    paychecks.push({
      date: current,
      ordinal: Math.floor((current.getDate() - 1) / (7 * weekStep)),
    });
    current = addWeeks(current, weekStep);
  }

  return paychecks;
}

/** Find the ordinal of a specific pay date (YYYY-MM-DD) for an income source. */
export function getPaycheckOrdinal(source: IncomeSource, payDate: string): number | undefined {
  const target = parseLocalDate(payDate);
  return getPaychecks(source, subDays(target, 7), 4).find((p) => isEqual(p.date, target))
    ?.ordinal;
}

/**
 * Number of paychecks every month is guaranteed to have. Extra paychecks in
 * longer months (a 3rd biweekly or 5th weekly check) aren't selectable.
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

export function getPaycheckSlotLabel(source: IncomeSource, ordinal: number): string {
  if (source.payFrequency === "semi-monthly") {
    return formatOrdinal(getSemiMonthlyDays(source)[ordinal] ?? ordinal + 1);
  }
  return `${formatOrdinal(ordinal + 1)} paycheck`;
}

/** The monthly paycheck slot a linked expense targets, or undefined if it lands on every paycheck. */
export function getLinkedOrdinal(expense: Expense, source: IncomeSource): number | undefined {
  const slotCount = getMonthlySlotCount(source);
  if (expense.linkSchedule !== "monthly" || slotCount < 2) return undefined;
  // Clamp in case the source's frequency changed to one with fewer paychecks
  return Math.min(expense.paycheckOrdinal ?? 0, slotCount - 1);
}

export function isExpenseLinkedToPaycheck(
  expense: Expense,
  sourceId: string,
  ordinal: number | undefined,
  source: IncomeSource | undefined
): boolean {
  if (expense.incomeSourceId !== sourceId || !source) return false;
  const target = getLinkedOrdinal(expense, source);
  return target === undefined || target === ordinal;
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

export function formatDisplayDate(date: Date): string {
  return format(date, "EEE, MMM d");
}
