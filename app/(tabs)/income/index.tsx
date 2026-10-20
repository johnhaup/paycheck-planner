import { useCallback, useMemo } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "@/store";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppFab } from "@/components/AppFab";
import { IncomeSourceCard } from "@/components/income/IncomeSourceCard";
import type { IncomeSource } from "@/types";

function keyExtractor(item: IncomeSource) {
  return item.id;
}

export default function IncomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const incomeSources = useStore((s) => s.incomeSources);
  const deleteIncomeSource = useStore((s) => s.deleteIncomeSource);

  const handleAdd = useCallback(() => {
    router.push("/income-form");
  }, [router]);

  const handleEdit = useCallback(
    (id: string) => {
      router.push({ pathname: "/income-form", params: { id } });
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: IncomeSource }) => (
      <IncomeSourceCard source={item} onEdit={handleEdit} onDelete={deleteIncomeSource} />
    ),
    [handleEdit, deleteIncomeSource]
  );

  const containerStyle = useMemo(
    () => [styles.container, { backgroundColor: colors.screenBackground }],
    [colors]
  );

  return (
    <View style={containerStyle}>
      {incomeSources.length === 0 ? (
        <View style={styles.emptyContainer}>
          <AppText variant="subtext" color="textMuted">
            No income sources added yet.
          </AppText>
        </View>
      ) : (
        <FlatList
          data={incomeSources}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.listContent}
        />
      )}
      <AppFab accessibilityLabel="Add income source" onPress={handleAdd} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: MEASUREMENTS.spacing.lg,
    paddingBottom: MEASUREMENTS.fabSize + MEASUREMENTS.spacing.bottom,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: MEASUREMENTS.spacing.section,
  },
});
