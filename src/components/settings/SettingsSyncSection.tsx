import { useCallback } from "react";
import { Alert, Platform } from "react-native";
import { useCloudSync, type SyncState } from "@johnhaup/expo-cloud-sync";
import { useT } from "@/hooks/useLocale";
import { formatDateTime } from "@/utils/dates";
import { toastError } from "@/utils/toastError";
import { AppSectionHeader } from "@/components/AppSectionHeader";
import { SettingsLinkRow } from "@/components/settings/SettingsLinkRow";
import { SettingsToggleRow } from "@/components/settings/SettingsToggleRow";

/** States in which a cloud copy may exist and can be deleted from here */
const HAS_CLOUD_COPY: SyncState[] = ["idle", "syncing", "quotaExceeded", "error"];

/** No usable account: sync cannot run, so the switch shows off and cannot be turned on */
const NO_ACCOUNT: SyncState[] = ["signedOut", "unavailable"];

/** Android: states in which this phone is signed in to Google and can sign out */
const SIGNED_IN: SyncState[] = [...HAS_CLOUD_COPY, "accountChanged", "needsAppUpdate"];

const ANDROID = Platform.OS === "android";

/**
 * Cloud sync, free for everyone: iCloud on iOS (on by default), Google Drive's hidden app folder on
 * Android (after Sign in with Google). Same switch and states on both; Android adds Sign in / Sign out.
 */
export function SettingsSyncSection() {
  const t = useT();
  const { state, lastSyncedAt, setEnabled, syncNow, adoptAccount, signIn, signOut } = useCloudSync();
  /** The platform's copy: `settings.sync.android.*` where Android words it differently */
  const p = useCallback(
    (key: keyof typeof IOS_KEYS) => t(ANDROID ? ANDROID_KEYS[key] : IOS_KEYS[key]),
    [t]
  );

  const failed = useCallback(() => toastError(t("settings.sync.error")), [t]);

  const handleSignIn = useCallback(() => {
    signIn().catch(() => toastError(t("settings.sync.android.signInError")));
  }, [signIn, t]);

  const handleSignOut = useCallback(() => {
    signOut({ deleteCloudCopy: false }).catch(failed);
  }, [signOut, failed]);

  const handleToggle = useCallback(
    (value: boolean) => {
      setEnabled(value).catch(failed);
    },
    [setEnabled, failed]
  );

  const handleRetry = useCallback(() => {
    syncNow().catch(failed);
  }, [syncNow, failed]);

  const handleMerge = useCallback(() => {
    Alert.alert(p("mergeTitle"), p("mergeBody"), [
      { text: t("settings.sync.notNow"), style: "cancel" },
      { text: t("settings.sync.mergeConfirm"), onPress: () => adoptAccount().catch(failed) },
    ]);
  }, [adoptAccount, failed, p, t]);

  const handleDeleteCopy = useCallback(() => {
    Alert.alert(p("deleteCopyTitle"), p("deleteCopyBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => signOut({ deleteCloudCopy: true }).catch(failed),
      },
    ]);
  }, [signOut, failed, p, t]);

  const noAccount = NO_ACCOUNT.includes(state);

  const hint = {
    off: p("off"),
    unavailable: p("unavailable"),
    signedOut: p("signedOut"),
    idle: lastSyncedAt
      ? t("settings.sync.lastSynced", { time: formatDateTime(new Date(lastSyncedAt)) })
      : p("on"),
    syncing: t("settings.sync.syncing"),
    accountChanged: p("accountChanged"),
    quotaExceeded: p("quotaFull"),
    needsAppUpdate: t("settings.sync.needsUpdate"),
    error: t("settings.sync.error"),
  }[state];

  return (
    <>
      <AppSectionHeader title={t("settings.sync.title")} />
      <SettingsToggleRow
        label={p("label")}
        hint={hint}
        value={state !== "off" && !noAccount}
        onValueChange={handleToggle}
        disabled={noAccount}
      />
      {state === "error" ? <SettingsLinkRow label={t("settings.sync.retry")} onPress={handleRetry} /> : null}
      {ANDROID && state === "signedOut" ? (
        <SettingsLinkRow label={t("settings.sync.android.signIn")} onPress={handleSignIn} />
      ) : null}
      {state === "accountChanged" ? <SettingsLinkRow label={p("merge")} onPress={handleMerge} /> : null}
      {ANDROID && SIGNED_IN.includes(state) ? (
        <SettingsLinkRow label={t("settings.sync.android.signOut")} onPress={handleSignOut} />
      ) : null}
      {HAS_CLOUD_COPY.includes(state) ? (
        <SettingsLinkRow label={p("deleteCopy")} destructive onPress={handleDeleteCopy} />
      ) : null}
    </>
  );
}

const IOS_KEYS = {
  label: "settings.sync.icloud",
  on: "settings.sync.on",
  off: "settings.sync.off",
  signedOut: "settings.sync.signedOut",
  unavailable: "settings.sync.unavailable",
  quotaFull: "settings.sync.quotaFull",
  accountChanged: "settings.sync.accountChanged",
  merge: "settings.sync.merge",
  mergeTitle: "settings.sync.mergeTitle",
  mergeBody: "settings.sync.mergeBody",
  deleteCopy: "settings.sync.deleteCopy",
  deleteCopyTitle: "settings.sync.deleteCopyTitle",
  deleteCopyBody: "settings.sync.deleteCopyBody",
} as const;

const ANDROID_KEYS = {
  label: "settings.sync.android.label",
  on: "settings.sync.android.on",
  off: "settings.sync.android.off",
  signedOut: "settings.sync.android.signedOut",
  unavailable: "settings.sync.android.unavailable",
  quotaFull: "settings.sync.android.quotaFull",
  accountChanged: "settings.sync.android.accountChanged",
  merge: "settings.sync.android.merge",
  mergeTitle: "settings.sync.android.mergeTitle",
  mergeBody: "settings.sync.android.mergeBody",
  deleteCopy: "settings.sync.android.deleteCopy",
  deleteCopyTitle: "settings.sync.android.deleteCopyTitle",
  deleteCopyBody: "settings.sync.android.deleteCopyBody",
} as const satisfies Record<keyof typeof IOS_KEYS, string>;
