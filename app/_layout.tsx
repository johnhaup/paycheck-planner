import { useCallback, useMemo } from "react";
import { Pressable } from "react-native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors, useIsDark } from "../src/hooks/useColors";
import { MEASUREMENTS } from "../src/constants/measurements";

export default function RootLayout() {
  const colors = useColors();
  const isDark = useIsDark();
  const router = useRouter();

  const handleCloseSettings = useCallback(() => {
    router.back();
  }, [router]);

  const settingsCloseButton = useMemo(
    () => (
      <Pressable onPress={handleCloseSettings} hitSlop={MEASUREMENTS.hitSlop}>
        <Ionicons name="close" size={24} color={colors.textDefault} />
      </Pressable>
    ),
    [handleCloseSettings, colors]
  );

  const screenOptions = useMemo(
    () => ({
      headerStyle: { backgroundColor: colors.screenBackground },
      headerTintColor: colors.textDefault,
      headerTitleStyle: { fontWeight: "600" as const },
      headerBackTitle: "Back",
      contentStyle: { backgroundColor: colors.screenBackground },
    }),
    [colors]
  );

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="income-form"
          options={{ title: "Income Source", presentation: "modal" }}
        />
        <Stack.Screen
          name="expense-form"
          options={{ title: "Expense", presentation: "modal" }}
        />
        <Stack.Screen
          name="pay-date-detail"
          options={{ title: "Pay Date", presentation: "card" }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: "Settings",
            presentation: "modal",
            headerRight: () => settingsCloseButton,
          }}
        />
      </Stack>
    </>
  );
}
