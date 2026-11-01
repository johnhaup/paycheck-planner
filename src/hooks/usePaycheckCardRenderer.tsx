import { useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import { useStore } from "@/store";
import { useThemeStore } from "@/stores/themeStore";
import { PaycheckCard } from "@/components/paychecks/PaycheckCard";
import { openPaymentLink } from "@/utils/links";
import { useProGate } from "@/hooks/useProGate";
import type { PaycheckItem } from "@/components/paychecks/types";

/** A FlatList `renderItem` for interactive paycheck cards, shared by the upcoming and past lists. */
export function usePaycheckCardRenderer() {
  const router = useRouter();
  const assignments = useStore((s) => s.assignments);
  const assignExpense = useStore((s) => s.assignExpense);
  const togglePaid = useStore((s) => s.togglePaid);
  const autoMarkPaid = useThemeStore((s) => s.autoMarkPaidOnLinkTap);
  const { gate } = useProGate();

  const handleTogglePaid = useCallback(
    (assignmentId: string, expenseId: string, payDate: string, sourceId: string) => {
      const id = assignmentId || assignExpense(expenseId, payDate, sourceId);
      togglePaid(id);
    },
    [assignExpense, togglePaid]
  );

  const handleLinkTap = useCallback(
    (link: string, assignmentId: string, expenseId: string, payDate: string, sourceId: string) => {
      openPaymentLink(link);
      if (autoMarkPaid) {
        const id = assignmentId || assignExpense(expenseId, payDate, sourceId);
        const assignment = assignments.find((a) => a.id === id);
        if (!assignment?.paid) {
          togglePaid(id);
        }
      }
    },
    [autoMarkPaid, assignExpense, assignments, togglePaid]
  );

  const handlePressPaycheck = useCallback(
    (payDate: string, sourceId: string) => {
      router.push({ pathname: "/pay-date-detail", params: { payDate, sourceId } });
    },
    [router]
  );

  // Changing one paycheck's bill or pay amount is Pro; amounts already changed still show
  const handleEditAmount = useMemo(
    () =>
      gate((expenseId: string, payDate: string, sourceId: string) => {
        router.push({ pathname: "/expense-amount", params: { expenseId, payDate, sourceId } });
      }),
    [gate, router]
  );

  const handleEditPayAmount = useMemo(
    () =>
      gate((payDate: string, sourceId: string) => {
        router.push({ pathname: "/paycheck-amount", params: { payDate, sourceId } });
      }),
    [gate, router]
  );

  const handleMoveBill = useCallback(
    (payDate: string, sourceId: string) => {
      router.push({ pathname: "/move-bill", params: { payDate, sourceId } });
    },
    [router]
  );

  const handleMoveExpense = useCallback(
    (expenseId: string, payDate: string, sourceId: string) => {
      router.push({ pathname: "/move-bill", params: { payDate, sourceId, expenseId } });
    },
    [router]
  );

  return useCallback(
    ({ item }: { item: PaycheckItem }) => (
      <PaycheckCard
        item={item}
        onPress={handlePressPaycheck}
        onTogglePaid={handleTogglePaid}
        onLinkTap={handleLinkTap}
        onEditAmount={handleEditAmount}
        onEditPayAmount={handleEditPayAmount}
        onMoveBill={handleMoveBill}
        onMoveExpense={handleMoveExpense}
      />
    ),
    [
      handlePressPaycheck,
      handleTogglePaid,
      handleLinkTap,
      handleEditAmount,
      handleEditPayAmount,
      handleMoveBill,
      handleMoveExpense,
    ]
  );
}
