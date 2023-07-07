import { Bill } from "@types";
import dayjs from "dayjs";
import { atom } from "jotai";

export const billsAtom = atom<Bill[]>([
  {
    amount: 515,
    dueDate: 5,
    paycheckSync: {
      cadence: 2,
    },
    link: "https://www.schoolsfirstfcu.org/#/accounts/summary",
    name: "Car Loan",
    startDate: dayjs().toDate(),
  },
  {
    amount: 100,
    dueDate: 12,
    link: "https://www.sce.com/",
    name: "Electric",
    startDate: dayjs().toDate(),
  },
  {
    amount: 100,
    dueDate: 28,
    link: "https://www.sce.com/",
    name: "Electric",
    startDate: dayjs().toDate(),
  },
]);
