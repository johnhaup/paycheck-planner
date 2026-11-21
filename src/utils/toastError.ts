import { toast } from "sonner-native";
import { hapticWarning } from "@/utils/haptics";

/** An error toast with the warning haptic, so every refused save feels the same. */
export function toastError(message: string) {
  hapticWarning();
  toast.error(message);
}
