import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { randomUUID } from "expo-crypto";
import { getPaycheck, isExpenseLinkedToPaycheck } from "@/utils/payDates";
import type {
  IncomeSource,
  Expense,
  ExpenseAssignment,
  PaycheckOverride,
  PaycheckRef,
} from "@/types";

interface AppState {
  incomeSources: IncomeSource[];
  expenses: Expense[];
  assignments: ExpenseAssignment[];
  paycheckOverrides: PaycheckOverride[];

  addIncomeSource: (source: Omit<IncomeSource, "id">) => void;
  updateIncomeSource: (id: string, updates: Partial<Omit<IncomeSource, "id">>) => void;
  deleteIncomeSource: (id: string) => void;

  addExpense: (expense: Omit<Expense, "id">) => string;
  updateExpense: (id: string, updates: Partial<Omit<Expense, "id">>) => void;
  deleteExpense: (id: string) => void;

  assignExpense: (expenseId: string, payDate: string, incomeSourceId: string) => string;
  unassignExpense: (assignmentId: string) => void;
  togglePaid: (assignmentId: string) => void;
  /** Marks these bills paid on one paycheck, assigning any linked bill that isn't yet */
  markPaid: (expenseIds: string[], payDate: string, incomeSourceId: string) => void;
  setAssignmentAmount: (assignmentId: string, amount: number | undefined) => void;
  /** Moves a one-time expense to a single paycheck, keeping its paid state */
  rescheduleExpense: (expenseId: string, payDate: string, incomeSourceId: string) => void;
  /** Moves one paycheck's bill to another paycheck, keeping its amount and paid state */
  moveExpense: (expenseId: string, from: PaycheckRef, to: PaycheckRef) => void;
  /** Overrides one paycheck's pay amount; undefined restores the source's usual amount */
  setPaycheckAmount: (sourceId: string, payDate: string, payAmount: number | undefined) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      incomeSources: [],
      expenses: [],
      assignments: [],
      paycheckOverrides: [],

      addIncomeSource: (source) =>
        set((s) => ({
          incomeSources: [...s.incomeSources, { ...source, id: randomUUID() }],
        })),

      updateIncomeSource: (id, updates) =>
        set((s) => ({
          incomeSources: s.incomeSources.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),

      deleteIncomeSource: (id) =>
        set((s) => ({
          incomeSources: s.incomeSources.filter((e) => e.id !== id),
          assignments: s.assignments.filter((a) => a.employerId !== id),
          paycheckOverrides: s.paycheckOverrides.filter((o) => o.sourceId !== id),
          expenses: s.expenses.map((e) =>
            e.incomeSourceId === id
              ? { ...e, incomeSourceId: undefined, linkSchedule: undefined, paycheckOrdinal: undefined }
              : e
          ),
        })),

      addExpense: (expense) => {
        const id = randomUUID();
        set((s) => ({
          expenses: [...s.expenses, { ...expense, id }],
        }));
        return id;
      },

      updateExpense: (id, updates) =>
        set((s) => ({
          expenses: s.expenses.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),

      deleteExpense: (id) =>
        set((s) => ({
          expenses: s.expenses.filter((e) => e.id !== id),
          assignments: s.assignments.filter((a) => a.expenseId !== id),
        })),

      assignExpense: (expenseId, payDate, incomeSourceId) => {
        // Re-adding a bill that was moved away revives its skip marker
        const skipped = get().assignments.find(
          (a) =>
            a.skipped &&
            a.expenseId === expenseId &&
            a.payDate === payDate &&
            a.employerId === incomeSourceId
        );
        if (skipped) {
          set((s) => ({
            assignments: s.assignments.map((a) =>
              a.id === skipped.id ? { id: a.id, expenseId, payDate, employerId: incomeSourceId } : a
            ),
          }));
          return skipped.id;
        }
        const id = randomUUID();
        set((s) => ({
          assignments: [
            ...s.assignments,
            { id, expenseId, payDate, employerId: incomeSourceId },
          ],
        }));
        return id;
      },

      unassignExpense: (assignmentId) =>
        set((s) => ({
          assignments: s.assignments.filter((a) => a.id !== assignmentId),
        })),

      togglePaid: (assignmentId) =>
        set((s) => ({
          assignments: s.assignments.map((a) =>
            a.id === assignmentId ? { ...a, paid: !a.paid } : a
          ),
        })),

      markPaid: (expenseIds, payDate, incomeSourceId) =>
        set((s) => {
          const ids = new Set(expenseIds);
          const isTarget = (a: ExpenseAssignment) =>
            !a.skipped && ids.has(a.expenseId) && a.payDate === payDate && a.employerId === incomeSourceId;
          const assignments = s.assignments.map((a) => (isTarget(a) ? { ...a, paid: true } : a));
          const assigned = new Set(assignments.filter(isTarget).map((a) => a.expenseId));
          for (const expenseId of ids) {
            if (!assigned.has(expenseId)) {
              assignments.push({ id: randomUUID(), expenseId, payDate, employerId: incomeSourceId, paid: true });
            }
          }
          return { assignments };
        }),

      setAssignmentAmount: (assignmentId, amount) =>
        set((s) => ({
          assignments: s.assignments.map((a) =>
            a.id === assignmentId ? { ...a, amount } : a
          ),
        })),

      rescheduleExpense: (expenseId, payDate, incomeSourceId) =>
        set((s) => {
          const current = s.assignments.find((a) => a.expenseId === expenseId);
          return {
            expenses: s.expenses.map((e) =>
              e.id === expenseId ? { ...e, dueDate: payDate } : e
            ),
            assignments: [
              ...s.assignments.filter((a) => a.expenseId !== expenseId),
              {
                id: current?.id ?? randomUUID(),
                expenseId,
                payDate,
                employerId: incomeSourceId,
                paid: current?.paid,
                amount: current?.amount,
              },
            ],
          };
        }),

      moveExpense: (expenseId, from, to) =>
        set((s) => {
          const expense = s.expenses.find((e) => e.id === expenseId);
          const source = s.incomeSources.find((src) => src.id === from.sourceId);
          const isAt = (a: ExpenseAssignment, ref: PaycheckRef) =>
            a.expenseId === expenseId && a.payDate === ref.payDate && a.employerId === ref.sourceId;
          const current = s.assignments.find((a) => isAt(a, from));
          // A linked bill would reappear on the paycheck it left, so leave a skip marker behind
          const leaveSkip =
            !!expense &&
            !!source &&
            isExpenseLinkedToPaycheck(expense, from.sourceId, getPaycheck(source, from.payDate), source);
          const assignments = s.assignments.filter((a) => !isAt(a, from) && !isAt(a, to));
          if (leaveSkip) {
            assignments.push({
              id: current?.id ?? randomUUID(),
              expenseId,
              payDate: from.payDate,
              employerId: from.sourceId,
              skipped: true,
            });
          }
          assignments.push({
            id: randomUUID(),
            expenseId,
            payDate: to.payDate,
            employerId: to.sourceId,
            paid: current?.paid,
            amount: current?.amount,
          });
          return {
            assignments,
            expenses:
              expense && !expense.isRecurring
                ? s.expenses.map((e) => (e.id === expenseId ? { ...e, dueDate: to.payDate } : e))
                : s.expenses,
          };
        }),

      setPaycheckAmount: (sourceId, payDate, payAmount) =>
        set((s) => {
          const others = s.paycheckOverrides.filter(
            (o) => !(o.sourceId === sourceId && o.payDate === payDate)
          );
          return {
            paycheckOverrides:
              payAmount === undefined ? others : [...others, { sourceId, payDate, payAmount }],
          };
        }),
    }),
    {
      name: "paycheck-planner-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
