import { useCallback, useMemo } from "react";
import { Pressable } from "react-native";
import { Stack, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { useStackScreenOptions } from "@/hooks/useStackScreenOptions";
import { MEASUREMENTS } from "@/constants/measurements";

export default function PaychecksLayout() {
  const colors = useColors();
  const router = useRouter();
  const screenOptions = useStackScreenOptions();

  const handleOpenSettings = useCallback(() => {
    router.push("/settings");
  }, [router]);

  const renderSettingsButton = useCallback(
    () => (
      <Pressable onPress={handleOpenSettings} hitSlop={MEASUREMENTS.hitSlop}>
        <Ionicons name="settings-outline" size={22} color={colors.textDefault} />
      </Pressable>
    ),
    [handleOpenSettings, colors]
  );

  const indexOptions = useMemo(
    () => ({ title: "Paychecks", headerRight: renderSettingsButton }),
    [renderSettingsButton]
  );

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={indexOptions} />
    </Stack>
  );
}
