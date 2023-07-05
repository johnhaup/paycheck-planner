import dayjs from "dayjs";
import { useAtom } from "jotai";
import { payScheduleAtom } from "../atoms/payScheduleAtom";
import { payStartDateAtom } from "../atoms/payStartDate";
import { PaySchedule } from "../types";

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

export function getUserPayDates() {
  const [paySchedule] = useAtom(payScheduleAtom);
  const [payStartDate] = useAtom(payStartDateAtom);

  return generatePayDates(payStartDate, paySchedule, 10);
}
