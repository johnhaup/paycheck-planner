export type WeeklyCadence = {
  type: "weeklyCadence";
  dayOfWeek: number; // 1 = Monday, 2 = Tuesday, etc.
  everyXWeeks: number;
};

export type PaySchedule = WeeklyCadence;

export type Bill = {
  name: string;
  amount: number;
  paycheckSync?: { cadence: number }; // cadence is every X number of paychecks
  dueDate: number; // 1 - 31
  link: string;
  startDate: Date;
  endDate?: Date;
};
