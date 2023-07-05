import { atom } from "jotai";
import { PaySchedule } from "../types";

export const payScheduleAtom = atom<PaySchedule>({
  type: "weeklyCadence",
  dayOfWeek: 5,
  everyXWeeks: 2,
});
