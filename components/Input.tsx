import React, { useCallback, useState } from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";
import { useThemeColor } from "styles";

export function Input(props: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const blurredBackground = useThemeColor("inputBlurredBackground");
  const focusedBackground = useThemeColor("inputFocusedBackground");
  const focusedBorder = useThemeColor("inputFocusedBorder");
  const placeHolderColor = useThemeColor("inputPlaceholderText");
  const color = useThemeColor("inputTextColor");

  const backgroundColor = isFocused ? focusedBackground : blurredBackground;
  const borderColor = isFocused ? focusedBorder : backgroundColor;

  const onBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const onFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  return (
    <TextInput
      style={[styles.base, { color, backgroundColor, borderColor }]}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholderTextColor={placeHolderColor}
      autoCapitalize="none"
      autoCorrect={false}
      {...props}
    ></TextInput>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    fontFamily: "Urbanist-SemiBold",
    fontSize: 14,
    letterSpacing: 0.002,
    borderWidth: 1,
  },
});
