import { Bill, PaySchedule } from "@types";
import dayjs from "dayjs";

export function generatePayDates(
  startDate: Date,
  paySchedule: PaySchedule,
  numDates?: number
) {
  const initialDate = dayjs(startDate);
  const datesArray = new Array(numDates).fill(null);

  const payDates = datesArray.reduce<Date[]>((acc, _, index) => {
    if (paySchedule.type === "weeklyCadence") {
      const { dayOfWeek, everyXWeeks } = paySchedule;

      return [
        ...acc,
        dayjs(initialDate)
          .add(index * everyXWeeks, "week")
          .day(dayOfWeek)
          .toDate(),
      ];
    }

    return acc;
  }, []);

  return payDates;
}

export const getBillsForPayPeriod = (paydate: Date, bills: Bill[]) => {
  return bills.filter((bill) => {
    const isSameOrAfter = dayjs(bill.dueDate).isAfter(
      dayjs(paydate).subtract(1, "day"),
      "date"
    );
    const isBeforeNextPaycheck = dayjs(bill.startDate).isBefore(
      dayjs(paydate).add(2, "weeks"),
      "date"
    );

    return isSameOrAfter && isBeforeNextPaycheck;
  }, []);
};

export const getLatestPayDate = (initialPayDate: Date) => {
  const dayOfWeek = dayjs(initialPayDate).day();

  const lastTwoWeeks = new Array(14).fill(null).map((_, index) => {
    return dayjs().subtract(index, "day").toDate();
  });

  const lastTwoDays = lastTwoWeeks.filter((date) => {
    return dayjs(date).day() === dayOfWeek;
  });

  const latestPayDate = lastTwoDays.reduce<Date>((acc, date) => {
    if (dayjs(date).diff(initialPayDate, "weeks") % 2 === 0) {
      return date;
    }

    return acc;
  }, initialPayDate);

  console.log("latestPayDate", latestPayDate);
  console.log("lastTwoDays", lastTwoDays);

  return latestPayDate;
};
