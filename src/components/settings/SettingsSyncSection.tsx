import { useCallback } from "react";
import { Alert } from "react-native";
import { useCloudSync, type SyncState } from "@johnhaup/expo-cloud-sync";
import { useT } from "@/hooks/useLocale";
import { formatDateTime } from "@/utils/dates";
import { toastError } from "@/utils/toastError";
import { AppSectionHeader } from "@/components/AppSectionHeader";
import { SettingsLinkRow } from "@/components/settings/SettingsLinkRow";
import { SettingsToggleRow } from "@/components/settings/SettingsToggleRow";

/** States in which a cloud copy may exist and can be deleted from here */
const HAS_CLOUD_COPY: SyncState[] = ["idle", "syncing", "quotaExceeded", "error"];

/** iCloud sync: on by default, free. iOS only; Android has no sync yet. */
export function SettingsSyncSection() {
  const t = useT();
  const { state, lastSyncedAt, setEnabled, syncNow, adoptAccount, signOut } = useCloudSync();

  const failed = useCallback(() => toastError(t("settings.sync.error")), [t]);

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
    Alert.alert(t("settings.sync.mergeTitle"), t("settings.sync.mergeBody"), [
      { text: t("settings.sync.notNow"), style: "cancel" },
      { text: t("settings.sync.mergeConfirm"), onPress: () => adoptAccount().catch(failed) },
    ]);
  }, [adoptAccount, failed, t]);

  const handleDeleteCopy = useCallback(() => {
    Alert.alert(t("settings.sync.deleteCopyTitle"), t("settings.sync.deleteCopyBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => signOut({ deleteCloudCopy: true }).catch(failed),
      },
    ]);
  }, [signOut, failed, t]);

  const hint = {
    off: t("settings.sync.off"),
    unavailable: t("settings.sync.unavailable"),
    signedOut: t("settings.sync.signedOut"),
    idle: lastSyncedAt
      ? t("settings.sync.lastSynced", { time: formatDateTime(new Date(lastSyncedAt)) })
      : t("settings.sync.on"),
    syncing: t("settings.sync.syncing"),
    accountChanged: t("settings.sync.accountChanged"),
    quotaExceeded: t("settings.sync.quotaFull"),
    needsAppUpdate: t("settings.sync.needsUpdate"),
    error: t("settings.sync.error"),
  }[state];

  return (
    <>
      <AppSectionHeader title={t("settings.sync.title")} />
      <SettingsToggleRow
        label={t("settings.sync.icloud")}
        hint={hint}
        value={state !== "off"}
        onValueChange={handleToggle}
      />
      {state === "error" ? <SettingsLinkRow label={t("settings.sync.retry")} onPress={handleRetry} /> : null}
      {state === "accountChanged" ? (
        <SettingsLinkRow label={t("settings.sync.merge")} onPress={handleMerge} />
      ) : null}
      {HAS_CLOUD_COPY.includes(state) ? (
        <SettingsLinkRow label={t("settings.sync.deleteCopy")} destructive onPress={handleDeleteCopy} />
      ) : null}
    </>
  );
}
