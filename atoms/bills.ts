import { Bill } from "@types";
import dayjs from "dayjs";
import { atom } from "jotai";

export const billsMapAtom = atom<{ [id: string]: Bill }>({
  "123": {
    id: "123",
    amount: 515,
    dueDate: 5,
    paycheckSync: {
      cadence: 2,
    },
    link: "https://www.schoolsfirstfcu.org/#/accounts/summary",
    name: "Car Loan",
    startDate: dayjs().toDate(),
    endDate: dayjs().add(1, "year").toDate(),
  },
  "456": {
    id: "456",
    amount: 100,
    dueDate: 12,
    link: "https://www.sce.com/",
    name: "Electric",
    startDate: dayjs().toDate(),
  },
  "789": {
    id: "789",
    amount: 40,
    dueDate: 28,
    link: "https://www.sce.com/",
    name: "Water",
    startDate: dayjs().toDate(),
  },
});

export const billsArrayAtom = atom<Bill[]>((get) =>
  Object.values(get(billsMapAtom))
);

export const totalBillsAtom = atom<number>((get) =>
  get(billsArrayAtom).reduce((acc, bill) => acc + bill.amount, 0)
);
