import { format, isFriday, nextFriday, startOfDay } from "date-fns";
import type { Expense, ExpenseAssignment, IncomeSource } from "@/types";
import { getPaychecks } from "@/utils/payDates";
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
