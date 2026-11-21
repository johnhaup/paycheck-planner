import { format, isFriday, nextFriday, startOfDay, subMonths, subWeeks } from "date-fns";
import type { ExpenseIcon } from "@/constants/expenseIcons";
import type { Expense, ExpenseAssignment, IncomeSource } from "@/types";
import { getPaychecks, parseLocalDate } from "@/utils/payDates";
import { t } from "@/localization/i18n";

const ISO_DATE = "yyyy-MM-dd";
const PAY_LINK = "https://example.com";

interface DemoData {
  incomeSources: IncomeSource[];
  expenses: Expense[];
  assignments: ExpenseAssignment[];
}

/** Sample budget for App Store screenshots and first-run "try it" data, anchored to `today` so it never looks stale */
export function buildDemoData(today: Date): DemoData {
  const start = startOfDay(today);
  const brightline: IncomeSource = {
    id: "demo-brightline",
    name: "Brightline Co.",
    payAmount: 1980,
    payFrequency: "biweekly",
    firstPayDate: format(isFriday(start) ? start : nextFriday(start), ISO_DATE),
  };
  const mesa: IncomeSource = {
    id: "demo-mesa",
    name: "Mesa Health",
    payAmount: 2150,
    payFrequency: "semi-monthly",
    firstPayDate: format(new Date(start.getFullYear(), start.getMonth(), 15), ISO_DATE),
    semiMonthlyDays: [15, 30],
    adjustToWorkday: true,
  };

  const [nextBrightline] = getPaychecks(brightline, start, 1);
  const [nextMesa] = getPaychecks(mesa, start, 1);
  const brightlineDate = format(nextBrightline.date, ISO_DATE);
  const mesaDate = format(nextMesa.date, ISO_DATE);
  const otherMesaOrdinal = 1 - nextMesa.ordinal;

  const monthly = (source: IncomeSource, paycheckOrdinal: number) => ({
    isRecurring: true,
    incomeSourceId: source.id,
    linkSchedule: "monthly" as const,
    paycheckOrdinal,
  });
  const everyPaycheck = (source: IncomeSource) => ({
    isRecurring: true,
    incomeSourceId: source.id,
    linkSchedule: "every-paycheck" as const,
  });

  return {
    incomeSources: [brightline, mesa],
    expenses: [
      { id: "demo-rent", payee: t("demo.rent"), amount: 1650, ...monthly(mesa, nextMesa.ordinal) },
      { id: "demo-groceries", payee: t("demo.groceries"), amount: 220, ...everyPaycheck(brightline) },
      { id: "demo-car", payee: t("demo.carPayment"), amount: 389, link: PAY_LINK, ...monthly(brightline, nextBrightline.ordinal) },
      { id: "demo-electric", payee: t("demo.electric"), amount: 96.4, link: PAY_LINK, ...monthly(mesa, nextMesa.ordinal) },
      { id: "demo-internet", payee: t("demo.internet"), amount: 70, link: PAY_LINK, ...monthly(brightline, nextBrightline.ordinal) },
      { id: "demo-phone", payee: t("demo.phone"), amount: 85, ...monthly(mesa, otherMesaOrdinal) },
      { id: "demo-savings", payee: t("demo.savings"), amount: 250, ...everyPaycheck(brightline) },
      { id: "demo-streaming", payee: t("demo.streaming"), amount: 17.99, ...monthly(mesa, otherMesaOrdinal) },
      { id: "demo-registration", payee: t("demo.carRegistration"), amount: 168, isRecurring: false, dueDate: brightlineDate },
    ],
    assignments: [
      { id: "demo-a1", expenseId: "demo-groceries", payDate: brightlineDate, employerId: brightline.id, paid: true },
      { id: "demo-a2", expenseId: "demo-car", payDate: brightlineDate, employerId: brightline.id, paid: true },
      { id: "demo-a3", expenseId: "demo-registration", payDate: brightlineDate, employerId: brightline.id },
      { id: "demo-a4", expenseId: "demo-electric", payDate: mesaDate, employerId: mesa.id, amount: 112.85 },
    ],
  };
}

const STORE_ICONS: Record<string, ExpenseIcon> = {
  "demo-rent": "home",
  "demo-groceries": "cart",
  "demo-car": "car",
  "demo-electric": "flash",
  "demo-internet": "wifi",
  "demo-phone": "phone-portrait",
  "demo-streaming": "tv",
  "demo-registration": "card",
  "demo-savings": "shield-checkmark",
};

/**
 * The sample budget dressed up for the store screenshots and previews (`paycheck-planner://demo`, store-demo
 * builds only): icons on the bills, and two set-asides with savings goals part-way there. The set-aside names
 * are English only, as the screenshots are. `short` adds a surprise car repair that leaves the next Mesa Health
 * paycheck short, for the "Move a bill" shot.
 */
export function buildStoreDemoData(today: Date, short = false): DemoData {
  const demo = buildDemoData(today);
  const [brightline, mesa] = demo.incomeSources;
  const firstBrightline = parseLocalDate(brightline.firstPayDate);
  const mesaDate = format(getPaychecks(mesa, startOfDay(today), 1)[0].date, ISO_DATE);
  const saved = (expenseId: string, source: IncomeSource, dates: Date[]): ExpenseAssignment[] =>
    dates.map((date, i) => ({
      id: `${expenseId}-saved-${i}`,
      expenseId,
      payDate: format(date, ISO_DATE),
      employerId: source.id,
      paid: true,
    }));

  return {
    ...demo,
    expenses: [
      ...demo.expenses.map((expense) => ({
        ...expense,
        icon: STORE_ICONS[expense.id],
        ...(expense.id === "demo-savings" ? { payee: "Emergency fund", kind: "set-aside" as const, goal: 5000 } : {}),
      })),
      {
        id: "demo-vacation",
        payee: "Vacation",
        kind: "set-aside",
        icon: "airplane",
        amount: 150,
        goal: 1800,
        isRecurring: true,
        incomeSourceId: mesa.id,
        linkSchedule: "every-paycheck",
      },
      ...(short
        ? [{ id: "demo-repair", payee: "Car repair", icon: "car" as const, amount: 420, isRecurring: false, dueDate: mesaDate }]
        : []),
    ],
    assignments: [
      ...demo.assignments,
      ...(short ? [{ id: "demo-a5", expenseId: "demo-repair", payDate: mesaDate, employerId: mesa.id }] : []),
      ...saved("demo-savings", brightline, Array.from({ length: 13 }, (_, i) => subWeeks(firstBrightline, 2 * (i + 1)))),
      ...saved("demo-vacation", mesa, getPaychecks(mesa, subMonths(startOfDay(today), 4), 7).map((p) => p.date)),
    ],
  };
}
