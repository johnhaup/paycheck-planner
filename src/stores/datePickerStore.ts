import { create } from "zustand";

interface DatePickerRequest {
  value: Date;
  onChange: (date: Date) => void;
}

/** Hands the current value and callback to the date-picker sheet route. */
interface DatePickerState {
  request?: DatePickerRequest;
  setRequest: (request: DatePickerRequest | undefined) => void;
}

export const useDatePickerStore = create<DatePickerState>()((set) => ({
  request: undefined,
  setRequest: (request) => set({ request }),
}));
