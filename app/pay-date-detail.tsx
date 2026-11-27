import { useEffect, useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColumns } from "@/hooks/useColumns";
import { useGutters } from "@/hooks/useGutters";
import { useBottomPadding } from "@/hooks/useBottomPadding";
import { PayDateDetail } from "@/components/payDateDetail/PayDateDetail";
import { usePaycheckSelectionStore } from "@/stores/paycheckSelectionStore";

export default function PayDateDetailScreen() {
  const { payDate, sourceId } = useLocalSearchParams<{
    payDate: string;
    sourceId: string;
  }>();
  const router = useRouter();
  const gutters = useGutters();
  const bottomPadding = useBottomPadding();
  const contentStyle = useMemo(() => [gutters, bottomPadding], [gutters, bottomPadding]);
  const wide = useColumns() !== undefined;
  const select = usePaycheckSelectionStore((s) => s.select);

  // On a regular-width screen a paycheck opens beside the Paychecks list, not over it. When an
  // iPhone Duo unfolds with this screen open, it closes into that view showing the same paycheck.
  useEffect(() => {
    if (!wide) return;
    select(payDate, sourceId);
    router.back();
  }, [wide, select, payDate, sourceId, router]);

  return <PayDateDetail payDate={payDate} sourceId={sourceId} contentContainerStyle={contentStyle} />;
}
