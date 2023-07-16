import dayjs from "dayjs";
import { atom } from "jotai";

export const activePayDateAtom = atom<Date>(dayjs().toDate());
