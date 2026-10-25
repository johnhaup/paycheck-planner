import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/hooks/useLocale";

interface Props {
  size?: number;
}

/** Marks a set-aside (spending cash, savings) in rows that otherwise look like bills. */
export function AppSetAsideIcon({ size = 14 }: Props) {
  const colors = useColors();
  const t = useT();

  return (
    <Ionicons
      name="wallet-outline"
      size={size}
      color={colors.primaryText}
      accessibilityLabel={t("expenses.kind.setAside")}
    />
  );
}
