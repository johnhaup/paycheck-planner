export type WeeklyCadence = {
  type: "weeklyCadence";
  dayOfWeek: number; // 1 = Monday, 2 = Tuesday, etc.
  everyXWeeks: number;
};

export type PaySchedule = WeeklyCadence;

export type Bill = {
  id: string;
  amount: number;
  dueDate: number; // 1 - 31
  name: string;
  startDate: Date;
  endDate?: Date;
  link?: string;
};

export type Transaction = {
  id: string;
  bill: Bill;
  amount: number;
  date: Date;
};

export type PayDay = {
  id: string;
  date: Date;
  paycheckAmount: number;
};
