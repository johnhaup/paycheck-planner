import { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import { MEASUREMENTS } from "@/constants/measurements";
import { useGroupedRowStyles } from "@/hooks/useGroupedRowStyles";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useT } from "@/hooks/useLocale";
import { AppText } from "@/components/AppText";
import { AppLetterTile } from "@/components/AppLetterTile";
import { AppSwipeToDelete } from "@/components/AppSwipeToDelete";
import { describePaySchedule } from "@/utils/payDates";
import type { IncomeSource } from "@/types";

interface Props {
  source: IncomeSource;
  tintIndex: number;
  isFirst: boolean;
  isLast: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function IncomeSourceRow({ source, tintIndex, isFirst, isLast, onEdit, onDelete }: Props) {
  const groupedStyles = useGroupedRowStyles(isFirst, isLast);
  const { split } = useMoneyFormat();
  const t = useT();
  const { whole, cents } = split(source.payAmount);

  const handlePress = useCallback(() => {
    onEdit(source.id);
  }, [onEdit, source.id]);

  const handleDelete = useCallback(() => {
    onDelete(source.id);
  }, [onDelete, source.id]);

  return (
    <AppSwipeToDelete
      confirmTitle={t("income.deleteTitle")}
      confirmMessage={t("income.deleteMessage", { name: source.name })}
      onConfirm={handleDelete}
      style={groupedStyles.container}
    >
      <Pressable style={groupedStyles.row} onPress={handlePress}>
        <AppLetterTile label={source.name} tintIndex={tintIndex} size={44} />
        <View style={styles.text}>
          <AppText variant="rowTitle" numberOfLines={1}>{source.name}</AppText>
          <AppText variant="meta" numberOfLines={1}>{describePaySchedule(source)}</AppText>
        </View>
        <View style={styles.amount}>
          <AppText variant="rowTitle">
            {whole}
            <AppText variant="rowTitle" color="textMuted">{cents}</AppText>
          </AppText>
          <AppText variant="caption">{t("income.perCheck")}</AppText>
        </View>
      </Pressable>
    </AppSwipeToDelete>
  );
}

const styles = StyleSheet.create({
  text: {
    flex: 1,
    gap: MEASUREMENTS.spacing.xs,
  },
  amount: {
    alignItems: "flex-end",
    gap: MEASUREMENTS.spacing.xs,
  },
});
