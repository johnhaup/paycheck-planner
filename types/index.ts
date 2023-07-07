export type WeeklyCadence = {
  type: "weeklyCadence";
  dayOfWeek: number; // 1 = Monday, 2 = Tuesday, etc.
  everyXWeeks: number;
};

export type PaySchedule = WeeklyCadence;

export type Bill = {
  amount: number;
  dueDate: number; // 1 - 31
  name: string;
  startDate: Date;
  endDate?: Date;
  link?: string;
  paycheckSync?: { cadence: number }; // cadence is every X number of paychecks
};
