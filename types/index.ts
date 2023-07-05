export type WeeklyCadence = {
  type: "weeklyCadence";
  dayOfWeek: number; // 1 = Monday, 2 = Tuesday, etc.
  everyXWeeks: number;
};

export type PaySchedule = WeeklyCadence;
