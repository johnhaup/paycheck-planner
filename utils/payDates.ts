import { PaySchedule } from "@types";
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
