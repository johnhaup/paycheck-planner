import { useMemo, type ComponentProps } from "react";
import { StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/hooks/useLocale";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppButton } from "@/components/AppButton";

type IconName = ComponentProps<typeof Ionicons>["name"];

interface Props {
  onAddIncome: () => void;
  onTrySample: () => void;
}

/** First-run content on the Paychecks tab, shown in the list until there's an income source. */
export function Welcome({ onAddIncome, onTrySample }: Props) {
  const t = useT();

  return (
    <View style={styles.content}>
      <AppText variant="title">{t("welcome.title")}</AppText>
      <AppText variant="meta">{t("welcome.body")}</AppText>
      <View style={styles.steps}>
        <Step icon="briefcase-outline" title={t("welcome.incomeTitle")} body={t("welcome.incomeBody")} />
        <Step icon="receipt-outline" title={t("welcome.billsTitle")} body={t("welcome.billsBody")} />
        <Step icon="wallet-outline" title={t("welcome.leftTitle")} body={t("welcome.leftBody")} />
      </View>
      <AppButton title={t("welcome.addIncome")} onPress={onAddIncome} />
      <AppButton title={t("welcome.trySample")} variant="outline" onPress={onTrySample} />
    </View>
  );
}

interface StepProps {
  icon: IconName;
  title: string;
  body: string;
}

function Step({ icon, title, body }: StepProps) {
  const colors = useColors();

  const iconWrapStyle = useMemo(
    () => [styles.iconWrap, { backgroundColor: colors.cardBackground }],
    [colors]
  );

  return (
    <View style={styles.step}>
      <View style={iconWrapStyle}>
        <Ionicons name={icon} size={22} color={colors.primaryText} />
      </View>
      <View style={styles.stepText}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="meta">{body}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: MEASUREMENTS.spacing.gutter,
    gap: MEASUREMENTS.spacing.base,
  },
  steps: {
    gap: MEASUREMENTS.spacing.xl,
    marginVertical: MEASUREMENTS.spacing.xl,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.lg,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    flex: 1,
    gap: MEASUREMENTS.spacing.xs,
  },
});
