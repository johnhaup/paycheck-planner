import { useCallback, useMemo } from "react";
import { View, FlatList, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "@/store";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppButton } from "@/components/AppButton";
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

  const handleDelete = useCallback(
    (source: IncomeSource) => {
      Alert.alert(
        "Delete Income Source",
        `Delete "${source.name}" and all its expense assignments?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => deleteIncomeSource(source.id),
          },
        ]
      );
    },
    [deleteIncomeSource]
  );

  const renderItem = useCallback(
    ({ item }: { item: IncomeSource }) => (
      <IncomeSourceCard source={item} onEdit={handleEdit} onDelete={handleDelete} />
    ),
    [handleEdit, handleDelete]
  );

  const footer = useMemo(
    () => (
      <AppButton
        title="Add Income Source"
        onPress={handleAdd}
        style={styles.addButton}
      />
    ),
    [handleAdd]
  );

  const listStyle = useMemo(
    () => ({ backgroundColor: colors.screenBackground }),
    [colors]
  );

  const emptyContainerStyle = useMemo(
    () => [styles.emptyContainer, listStyle],
    [listStyle]
  );

  if (incomeSources.length === 0) {
    return (
      <View style={emptyContainerStyle}>
        <AppText variant="subtext" color="textMuted" style={styles.emptyText}>
          No income sources added yet.
        </AppText>
        <AppButton title="Add Income Source" onPress={handleAdd} />
      </View>
    );
  }

  return (
    <FlatList
      data={incomeSources}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentInsetAdjustmentBehavior="automatic"
      style={listStyle}
      contentContainerStyle={styles.listContent}
      ListFooterComponent={footer}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    padding: MEASUREMENTS.spacing.lg,
    paddingBottom: MEASUREMENTS.spacing.bottom,
  },
  addButton: {
    marginTop: MEASUREMENTS.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: MEASUREMENTS.spacing.section,
  },
  emptyText: {
    marginBottom: MEASUREMENTS.spacing.xl,
  },
});
