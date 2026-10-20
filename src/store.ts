import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { randomUUID } from "expo-crypto";
import type { IncomeSource, Expense, ExpenseAssignment } from "@/types";

interface AppState {
  incomeSources: IncomeSource[];
  expenses: Expense[];
  assignments: ExpenseAssignment[];

  addIncomeSource: (source: Omit<IncomeSource, "id">) => void;
  updateIncomeSource: (id: string, updates: Partial<Omit<IncomeSource, "id">>) => void;
  deleteIncomeSource: (id: string) => void;

  addExpense: (expense: Omit<Expense, "id">) => string;
  updateExpense: (id: string, updates: Partial<Omit<Expense, "id">>) => void;
  deleteExpense: (id: string) => void;

  assignExpense: (expenseId: string, payDate: string, incomeSourceId: string) => string;
  unassignExpense: (assignmentId: string) => void;
  togglePaid: (assignmentId: string) => void;
  getAssignmentsForPayDate: (
    payDate: string,
    incomeSourceId: string
  ) => ExpenseAssignment[];
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      incomeSources: [],
      expenses: [],
      assignments: [],

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

      getAssignmentsForPayDate: (payDate, incomeSourceId) => {
        return get().assignments.filter(
          (a) => a.payDate === payDate && a.employerId === incomeSourceId
        );
      },
    }),
    {
      name: "paycheck-planner-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
