import { getLocaleTag } from "@/stores/localeStore";

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const tag = getLocaleTag();
  const key = `${tag}|${JSON.stringify(options)}`;
  let cached = formatters.get(key);
  if (!cached) {
    cached = new Intl.DateTimeFormat(tag, options);
    formatters.set(key, cached);
  }
  return cached;
}

/** "Friday" */
export function formatWeekday(date: Date): string {
  return formatter({ weekday: "long" }).format(date);
}

/** "Fri, Oct 24" */
export function formatShortDate(date: Date): string {
  return formatter({ weekday: "short", month: "short", day: "numeric" }).format(date);
}

/** "Oct 24" */
export function formatMonthDay(date: Date): string {
  return formatter({ month: "short", day: "numeric" }).format(date);
}

/** "Friday, October 24" */
export function formatLongDate(date: Date): string {
  return formatter({ weekday: "long", month: "long", day: "numeric" }).format(date);
}

/** "Fri, Oct 24, 2026" */
export function formatFullDate(date: Date): string {
  return formatter({ weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(
    date
  );
}

/** "Oct" */
export function formatMonthShort(date: Date): string {
  return formatter({ month: "short" }).format(date);
}

/** "October", or "January 2027" when `withYear` */
export function formatMonthLong(date: Date, withYear = false): string {
  return formatter(withYear ? { month: "long", year: "numeric" } : { month: "long" }).format(date);
}

/** "24" */
export function formatDayOfMonth(date: Date): string {
  return formatter({ day: "numeric" }).format(date);
}

/** "6:00 PM" */
export function formatTimeOfDay(hour: number, minute: number): string {
  return formatter({ hour: "numeric", minute: "2-digit" }).format(new Date(2000, 0, 1, hour, minute));
}
