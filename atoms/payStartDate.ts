import dayjs from "dayjs";
import { atom } from "jotai";

export const payStartDateAtom = atom<Date>(dayjs("2023-06-29").toDate());
