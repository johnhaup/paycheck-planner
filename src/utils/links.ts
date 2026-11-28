import { Alert, Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { t } from "@/localization/i18n";

/** Trim and add https:// when the user typed a bare domain like "pay.example.com". */
export function normalizeLink(link: string): string | undefined {
  const trimmed = link.trim();
  if (!trimmed) return undefined;
  return /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

// A second tap while the sheet is still coming up would reject ("already presenting")
// and show the failure alert for a link that did open.
let browserOpen = false;

/**
 * Web links open in a browser sheet over the app (SFSafariViewController / Custom Tabs), so
 * autofill, passkeys and Apple Pay work and dismissing it returns to the same screen.
 * Other schemes (tel:, mailto:, app links) go to the system.
 */
export function openPaymentLink(link: string) {
  const url = normalizeLink(link) ?? link;
  const fail = () => Alert.alert(t("links.openFailed"), link);
  if (!/^https?:\/\//i.test(url)) {
    Linking.openURL(url).catch(fail);
    return;
  }
  if (browserOpen) return;
  browserOpen = true;
  WebBrowser.openBrowserAsync(url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
  })
    .catch(fail)
    .finally(() => {
      browserOpen = false;
    });
}
