import { useCallback, useMemo } from "react";
import { Pressable } from "react-native";
import { Tabs, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "../../src/hooks/useColors";
import { MEASUREMENTS } from "../../src/constants/measurements";

export default function TabsLayout() {
  const colors = useColors();
  const router = useRouter();

  const handleOpenSettings = useCallback(() => {
    router.push("/settings");
  }, [router]);

  const screenOptions = useMemo(
    () => ({
      headerStyle: { backgroundColor: colors.screenBackground },
      headerTintColor: colors.textDefault,
      headerTitleStyle: { fontWeight: "600" as const },
      tabBarStyle: {
        backgroundColor: colors.tabBarBackground,
        borderTopColor: colors.border,
      },
      tabBarActiveTintColor: colors.tabBarActive,
      tabBarInactiveTintColor: colors.tabBarInactive,
    }),
    [colors]
  );

  const settingsButton = useMemo(
    () => (
      <Pressable
        onPress={handleOpenSettings}
        hitSlop={MEASUREMENTS.hitSlop}
        style={{ marginRight: MEASUREMENTS.spacing.lg }}
      >
        <Ionicons name="settings-outline" size={22} color={colors.textDefault} />
      </Pressable>
    ),
    [handleOpenSettings, colors]
  );

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Paychecks",
          headerRight: () => settingsButton,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="income"
        options={{
          title: "Income",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Expenses",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
