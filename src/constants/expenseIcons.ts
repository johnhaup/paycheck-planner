export const EXPENSE_ICONS = [
  "home",
  "car",
  "flash",
  "water",
  "flame",
  "wifi",
  "phone-portrait",
  "tv",
  "cart",
  "restaurant",
  "medkit",
  "fitness",
  "school",
  "card",
  "shield-checkmark",
  "paw",
  "airplane",
  "gift",
  "musical-notes",
  "game-controller",
] as const;

export type ExpenseIcon = (typeof EXPENSE_ICONS)[number];
