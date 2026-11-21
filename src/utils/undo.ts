import { toast } from "sonner-native";
import { useStore } from "@/store";
import { t } from "@/localization/i18n";
import { hapticSuccess } from "@/utils/haptics";

/** Runs a budget change and shows a toast whose Undo puts the budget back as it was. */
export function withUndo(message: string, change: () => void) {
  const { incomeSources, expenses, assignments, paycheckOverrides } = useStore.getState();
  change();
  hapticSuccess();
  const id = toast(message, {
    action: {
      label: t("common.undo"),
      onClick: () => {
        useStore.setState({ incomeSources, expenses, assignments, paycheckOverrides });
        toast.dismiss(id);
      },
    },
  });
}
