import { useCallback, useMemo } from "react";
import { Pressable, StyleSheet, ColorValue } from "react-native";
import { Tabs, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";

interface TabBarIconProps {
  color: ColorValue;
  size: number;
}

function renderWalletIcon({ color, size }: TabBarIconProps) {
  return <Ionicons name="wallet-outline" size={size} color={color} />;
}

function renderBriefcaseIcon({ color, size }: TabBarIconProps) {
  return <Ionicons name="briefcase-outline" size={size} color={color} />;
}

function renderReceiptIcon({ color, size }: TabBarIconProps) {
  return <Ionicons name="receipt-outline" size={size} color={color} />;
}

const INCOME_OPTIONS = { title: "Income", tabBarIcon: renderBriefcaseIcon };
const EXPENSES_OPTIONS = { title: "Expenses", tabBarIcon: renderReceiptIcon };

export default function TabsLayout() {
  const colors = useColors();
  const router = useRouter();

  const handleOpenSettings = useCallback(() => {
    router.push("/settings");
  }, [router]);

  const renderSettingsButton = useCallback(
    () => (
      <Pressable
        onPress={handleOpenSettings}
        hitSlop={MEASUREMENTS.hitSlop}
        style={styles.settingsButton}
      >
        <Ionicons name="settings-outline" size={22} color={colors.textDefault} />
      </Pressable>
    ),
    [handleOpenSettings, colors]
  );

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

  const paychecksOptions = useMemo(
    () => ({
      title: "Paychecks",
      headerRight: renderSettingsButton,
      tabBarIcon: renderWalletIcon,
    }),
    [renderSettingsButton]
  );

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="index" options={paychecksOptions} />
      <Tabs.Screen name="income" options={INCOME_OPTIONS} />
      <Tabs.Screen name="expenses" options={EXPENSES_OPTIONS} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  settingsButton: {
    marginRight: MEASUREMENTS.spacing.lg,
  },
});
