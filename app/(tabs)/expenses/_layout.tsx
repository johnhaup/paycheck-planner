import { Stack } from "expo-router";
import { useStackScreenOptions } from "@/hooks/useStackScreenOptions";

const INDEX_OPTIONS = { title: "Expenses" };

export default function ExpensesLayout() {
  const screenOptions = useStackScreenOptions(true);

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={INDEX_OPTIONS} />
    </Stack>
  );
}
