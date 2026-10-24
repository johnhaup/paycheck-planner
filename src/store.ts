import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { randomUUID } from "expo-crypto";
import type { IncomeSource, Expense, ExpenseAssignment, PaycheckOverride } from "@/types";

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
  setAssignmentAmount: (assignmentId: string, amount: number | undefined) => void;
  /** Moves a one-time expense to a single paycheck, keeping its paid state */
  rescheduleExpense: (expenseId: string, payDate: string, incomeSourceId: string) => void;
  /** Overrides one paycheck's pay amount; undefined restores the source's usual amount */
  setPaycheckAmount: (sourceId: string, payDate: string, payAmount: number | undefined) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
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
