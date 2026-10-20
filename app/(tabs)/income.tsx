import { useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "../../src/store";
import { useColors } from "../../src/hooks/useColors";
import { MEASUREMENTS } from "../../src/constants/measurements";
import { AppText } from "../../src/components/AppText";
import { AppButton } from "../../src/components/AppButton";
import type { IncomeSource } from "../../src/types";

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  "semi-monthly": "Semi-monthly",
  monthly: "Monthly",
};

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
      <Pressable
        style={[styles.card, { backgroundColor: colors.cardBackground }]}
        onPress={() => handleEdit(item.id)}
        onLongPress={() => handleDelete(item)}
      >
        <View style={styles.cardTop}>
          <AppText variant="h3">{item.name}</AppText>
          <AppText variant="h3" color="primary">
            ${item.payAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </AppText>
        </View>
        <AppText variant="caption" style={styles.frequency}>
          {FREQUENCY_LABELS[item.payFrequency] ?? item.payFrequency}
        </AppText>
      </Pressable>
    ),
    [handleEdit, handleDelete, colors]
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

  if (incomeSources.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.screenBackground }]}>
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
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      style={{ backgroundColor: colors.screenBackground }}
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
  card: {
    padding: MEASUREMENTS.spacing.lg,
    borderRadius: MEASUREMENTS.radius.lg,
    marginBottom: MEASUREMENTS.spacing.md + 2,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  frequency: {
    marginTop: MEASUREMENTS.spacing.sm,
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
