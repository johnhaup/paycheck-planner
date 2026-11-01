import { useCallback, useMemo } from "react";
import { Pressable } from "react-native";
import { Stack, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { useStackScreenOptions } from "@/hooks/useStackScreenOptions";
import { useT } from "@/hooks/useLocale";
import { MEASUREMENTS } from "@/constants/measurements";

export default function PaychecksLayout() {
  const colors = useColors();
  const router = useRouter();
  const screenOptions = useStackScreenOptions(true);
  const t = useT();

  const handleOpenSettings = useCallback(() => {
    router.push("/settings");
  }, [router]);

  const renderSettingsButton = useCallback(
    () => (
      <Pressable
        onPress={handleOpenSettings}
        hitSlop={MEASUREMENTS.hitSlop}
        accessibilityRole="button"
        accessibilityLabel={t("screens.settings")}
      >
        <Ionicons name="settings-outline" size={22} color={colors.textDefault} />
      </Pressable>
    ),
    [handleOpenSettings, colors, t]
  );

  const indexOptions = useMemo(
    () => ({ title: t("tabs.paychecks"), headerRight: renderSettingsButton }),
    [renderSettingsButton, t]
  );

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={indexOptions} />
    </Stack>
  );
}
