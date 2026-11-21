import { create } from "zustand";

interface Selection {
  payDate: string;
  sourceId: string;
}

/**
 * The paycheck shown beside the Paychecks list on a regular-width screen (iPhone Duo unfolded).
 * Kept outside the screen so the pay date screen can hand over its paycheck when the Duo unfolds.
 */
interface PaycheckSelectionState {
  selected?: Selection;
  select: (payDate: string, sourceId: string) => void;
}

export const usePaycheckSelectionStore = create<PaycheckSelectionState>()((set) => ({
  selected: undefined,
  select: (payDate, sourceId) => set({ selected: { payDate, sourceId } }),
}));
