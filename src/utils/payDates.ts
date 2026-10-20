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
import type { IncomeSource } from "@/types";

/** Parse a YYYY-MM-DD string as local midnight (not UTC). */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Generate upcoming pay dates for an income source within a date range.
 */
export function getPayDates(
  source: IncomeSource,
  from: Date,
  count: number
): Date[] {
  const dates: Date[] = [];
  const anchor = startOfDay(parseLocalDate(source.firstPayDate));
  const start = startOfDay(from);

  if (source.payFrequency === "semi-monthly") {
    const [dayA, dayB] = source.semiMonthlyDays ?? [1, 15];
    let current = startOfDay(new Date(start.getFullYear(), start.getMonth(), 1));

    while (dates.length < count) {
      const dateA = setDate(current, Math.min(dayA, daysInMonth(current)));
      const dateB = setDate(current, Math.min(dayB, daysInMonth(current)));

      for (const d of [dateA, dateB].sort((a, b) => a.getTime() - b.getTime())) {
        const adjusted = source.adjustToWorkday ? shiftToFriday(d) : d;
        if ((isEqual(adjusted, start) || isBefore(start, adjusted)) && dates.length < count) {
          dates.push(adjusted);
        }
      }
      current = addMonths(current, 1);
    }
    return dates;
  }

  if (source.payFrequency === "monthly") {
    let current = startOfDay(
      new Date(start.getFullYear(), start.getMonth(), anchor.getDate())
    );
    if (isBefore(current, start)) {
      current = addMonths(current, 1);
    }
    while (dates.length < count) {
      dates.push(current);
      current = addMonths(current, 1);
    }
    return dates;
  }

  // weekly or biweekly
  const weekStep = source.payFrequency === "weekly" ? 1 : 2;
  let current = anchor;

  // Advance to the first pay date on or after `start`
  while (isBefore(current, start)) {
    current = addWeeks(current, weekStep);
  }

  while (dates.length < count) {
    dates.push(current);
    current = addWeeks(current, weekStep);
  }

  return dates;
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
