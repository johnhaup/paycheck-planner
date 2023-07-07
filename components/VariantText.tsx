import { ThemeColor, useThemeColor } from "@styles";
import React from "react";
import { StyleSheet, Text, TextProps } from "react-native";

interface Props extends TextProps {
  variant: keyof typeof styles;
  themeColor?: ThemeColor;
}

export function VariantText({
  themeColor = "textDefault",
  style,
  variant,
  ...rest
}: Props) {
  const variantStyle = styles[variant];
  const color = useThemeColor(themeColor);

  return <Text style={[variantStyle, { color }, style]} {...rest} />;
}

const bodyStyles = {
  xl: {
    fontSize: 18,
    lineHeight: 25,
    letterSpacing: 0.002,
  },
  lg: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.002,
  },
  md: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.002,
  },
  sm: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.002,
  },
  xs: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.002,
  },
};

const styles = StyleSheet.create({
  heading1: {
    fontFamily: "Urbanist-Bold",
    fontSize: 48,
    lineHeight: 53,
  },
  heading2: {
    fontFamily: "Urbanist-Bold",
    fontSize: 40,
    lineHeight: 44,
  },
  heading3: {
    fontFamily: "Urbanist-Bold",
    fontSize: 32,
    lineHeight: 35,
  },
  heading4: {
    fontFamily: "Urbanist-Bold",
    fontSize: 24,
    lineHeight: 29,
  },
  heading5: {
    fontFamily: "Urbanist-Bold",
    fontSize: 20,
    lineHeight: 24,
  },
  heading6: {
    fontFamily: "Urbanist-Bold",
    fontSize: 18,
    lineHeight: 22,
  },
  bodyXLRegular: {
    fontFamily: "Urbanist-Regular",
    ...bodyStyles.xl,
  },
  bodyXLBold: {
    fontFamily: "Urbanist-Bold",
    ...bodyStyles.xl,
  },
  bodyXLSemiBold: {
    fontFamily: "Urbanist-SemiBold",
    ...bodyStyles.xl,
  },
  bodyXLMedium: {
    fontFamily: "Urbanist-Medium",
    ...bodyStyles.xl,
  },
  bodyLGRegular: {
    fontFamily: "Urbanist-Regular",
    ...bodyStyles.lg,
  },
  bodyLGBold: {
    fontFamily: "Urbanist-Bold",
    ...bodyStyles.lg,
  },
  bodyLGSemiBold: {
    fontFamily: "Urbanist-SemiBold",
    ...bodyStyles.lg,
  },
  bodyLGMedium: {
    fontFamily: "Urbanist-Medium",
    ...bodyStyles.lg,
  },
  bodyMDRegular: {
    fontFamily: "Urbanist-Regular",
    ...bodyStyles.md,
  },
  bodyMDBold: {
    fontFamily: "Urbanist-Bold",
    ...bodyStyles.md,
  },
  bodyMDSemiBold: {
    fontFamily: "Urbanist-SemiBold",
    ...bodyStyles.md,
  },
  bodyMDMedium: {
    fontFamily: "Urbanist-Medium",
    ...bodyStyles.md,
  },
  bodySMRegular: {
    fontFamily: "Urbanist-Regular",
    ...bodyStyles.sm,
  },
  bodySMBold: {
    fontFamily: "Urbanist-Bold",
    ...bodyStyles.sm,
  },
  bodySMSemiBold: {
    fontFamily: "Urbanist-SemiBold",
    ...bodyStyles.sm,
  },
  bodySMMedium: {
    fontFamily: "Urbanist-Medium",
    ...bodyStyles.sm,
  },
  bodyXSRegular: {
    fontFamily: "Urbanist-Regular",
    ...bodyStyles.xs,
  },
  bodyXSBold: {
    fontFamily: "Urbanist-Bold",
    ...bodyStyles.xs,
  },
  bodyXSSemiBold: {
    fontFamily: "Urbanist-SemiBold",
    ...bodyStyles.xs,
  },
  bodyXSMedium: {
    fontFamily: "Urbanist-Medium",
    ...bodyStyles.xs,
  },
});
