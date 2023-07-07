import { atom } from "jotai";

import { billsAtom } from "./billsAtom";

export const totalBillsAtom = atom<number>((get) =>
  get(billsAtom).reduce((acc, bill) => acc + bill.amount, 0)
);
