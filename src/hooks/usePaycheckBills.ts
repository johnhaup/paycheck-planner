import { useMemo } from "react";
import { useStore } from "@/store";
import { getPaycheckBills } from "@/utils/paycheckBills";

/** `getPaycheckBills` for the current store, shared by the Pay date screen and its bar's "Mark all paid". */
export function usePaycheckBills(payDate: string, sourceId: string) {
  const incomeSources = useStore((s) => s.incomeSources);
  const expenses = useStore((s) => s.expenses);
  const assignments = useStore((s) => s.assignments);

  return useMemo(
    () => getPaycheckBills({ incomeSources, expenses, assignments }, payDate, sourceId),
    [incomeSources, expenses, assignments, payDate, sourceId]
  );
}
