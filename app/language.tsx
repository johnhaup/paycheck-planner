import { useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import { useT } from "@/hooks/useLocale";
import { useLocaleStore, SYSTEM } from "@/stores/localeStore";
import { AVAILABLE_LANGUAGES, getDeviceLanguage, isLanguageCode } from "@/localization/i18n";
import { LANGUAGES } from "@/localization/languages";
import { SettingsChoiceList, type Choice } from "@/components/settings/SettingsChoiceList";

export default function LanguageScreen() {
  const router = useRouter();
  const t = useT();
  const language = useLocaleStore((s) => s.language);
  const setLanguage = useLocaleStore((s) => s.setLanguage);

  const handleSelect = useCallback(
    (key: string) => {
      setLanguage(isLanguageCode(key) ? key : SYSTEM);
      router.back();
    },
    [setLanguage, router]
  );

  const choices = useMemo<Choice[]>(() => {
    const device = LANGUAGES.find((l) => l.code === getDeviceLanguage());
    return [
      { key: SYSTEM, label: t("common.systemDefault"), detail: device?.nativeName },
      ...AVAILABLE_LANGUAGES.map((l) => ({ key: l.code, label: l.nativeName })),
    ];
  }, [t]);

  return <SettingsChoiceList choices={choices} selectedKey={language} onSelect={handleSelect} />;
}
