import dayjs from "dayjs";
import { atom } from "jotai";

export const payStartDateAtom = atom<Date>(dayjs().toDate());
