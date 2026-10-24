import { Alert, Linking } from "react-native";
import { t } from "@/localization/i18n";

/** Trim and add https:// when the user typed a bare domain like "pay.example.com". */
export function normalizeLink(link: string): string | undefined {
  const trimmed = link.trim();
  if (!trimmed) return undefined;
  return /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function openPaymentLink(link: string) {
  Linking.openURL(normalizeLink(link) ?? link).catch(() => {
    Alert.alert(t("links.openFailed"), link);
  });
}
