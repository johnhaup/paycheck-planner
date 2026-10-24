import { useMemo } from "react";
import { Stack } from "expo-router";
import { useStackScreenOptions } from "@/hooks/useStackScreenOptions";
import { useT } from "@/hooks/useLocale";

export default function ExpensesLayout() {
  const screenOptions = useStackScreenOptions(true);
  const t = useT();

  const indexOptions = useMemo(() => ({ title: t("tabs.expenses") }), [t]);

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={indexOptions} />
    </Stack>
  );
}
