import { useMemo } from "react";
import { Platform } from "react-native";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useColors } from "@/hooks/useColors";

const PAYCHECKS_SF = { default: "wallet.bifold", selected: "wallet.bifold.fill" } as const;
const INCOME_SF = { default: "briefcase", selected: "briefcase.fill" } as const;
const EXPENSES_SF = { default: "list.bullet.rectangle", selected: "list.bullet.rectangle.fill" } as const;

export default function TabsLayout() {
  const colors = useColors();

  // iOS 26 Liquid Glass derives its look from the content behind it, so only the
  // selected tint is set there. Android's Material bar needs explicit colors.
  const tabBarProps = useMemo(
    () =>
      Platform.OS === "android"
        ? {
            tintColor: colors.tabBarActive,
            backgroundColor: colors.tabBarBackground,
            indicatorColor: colors.cardBackgroundElevated,
            rippleColor: colors.cardBackgroundElevated,
            iconColor: { default: colors.tabBarInactive, selected: colors.tabBarActive },
            labelStyle: {
              default: { color: colors.tabBarInactive },
              selected: { color: colors.tabBarActive },
            },
          }
        : { tintColor: colors.tabBarActive },
    [colors]
  );

  return (
    <NativeTabs {...tabBarProps} disableTransparentOnScrollEdge>
      <NativeTabs.Trigger name="(paychecks)">
        <NativeTabs.Trigger.Label>Paychecks</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={PAYCHECKS_SF} md="account_balance_wallet" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="income">
        <NativeTabs.Trigger.Label>Income</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={INCOME_SF} md="work" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="expenses">
        <NativeTabs.Trigger.Label>Expenses</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={EXPENSES_SF} md="receipt_long" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
