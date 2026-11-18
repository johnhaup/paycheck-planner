import { useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useLocale, useT } from "@/hooks/useLocale";
import { useLocaleStore, SYSTEM } from "@/stores/localeStore";
import { getDeviceCurrency } from "@/localization/i18n";
import { CURRENCIES } from "@/localization/currencies";
import { formatMoneyIn } from "@/utils/money";
import { SettingsChoiceList, type Choice } from "@/components/settings/SettingsChoiceList";

const SAMPLE_AMOUNT = 1234.56;

export default function CurrencyScreen() {
  const router = useRouter();
  const t = useT();
  const { localeTag } = useLocale();
  const currency = useLocaleStore((s) => s.currency);
  const setCurrency = useLocaleStore((s) => s.setCurrency);

  const handleSelect = useCallback(
    (key: string) => {
      setCurrency(key);
      router.back();
    },
    [setCurrency, router]
  );

  const choices = useMemo<Choice[]>(() => {
    const device = getDeviceCurrency();
    const codes = [device, ...CURRENCIES.filter((c) => c !== device)];
    return [
      { key: SYSTEM, label: t("common.systemDefault"), detail: formatMoneyIn(SAMPLE_AMOUNT, device) },
      ...codes.map((code) => ({ key: code, label: code, detail: formatMoneyIn(SAMPLE_AMOUNT, code) })),
    ];
    // localeTag changes the sample formatting
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, localeTag]);

  // A modal reads its own safe area: iPhone Duo centres it clear of the status column when unfolded
  return (
    <SafeAreaProvider>
      <SettingsChoiceList choices={choices} selectedKey={currency} onSelect={handleSelect} />
    </SafeAreaProvider>
  );
}
