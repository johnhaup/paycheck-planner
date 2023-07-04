import "react-native-gesture-handler";

import { BBText, Chip, CheckBox, Toggle } from "components";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { ScrollView } from "react-native";
import { Spacer } from "react-native-spacer-view";
import { TextButton } from "../components/TextButton";
import { Input } from "../components/Input";

export default function App() {
  const [fontsLoaded] = useFonts({
    "Urbanist-Bold": require("../assets/fonts/Urbanist-Bold.ttf"),
    "Urbanist-Medium": require("../assets/fonts/Urbanist-Medium.ttf"),
    "Urbanist-Regular": require("../assets/fonts/Urbanist-Regular.ttf"),
    "Urbanist-SemiBold": require("../assets/fonts/Urbanist-SemiBold.ttf"),
  });

  const [checked, setChecked] = useState(false);
  const [toggled, setToggled] = useState(false);

  const onCheckBoxTap = () => {
    setChecked((prev) => !prev);
  };

  const onToggleTap = () => {
    setToggled((prev) => !prev);
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ScrollView>
      <StatusBar style="auto" />
      <Spacer safeTop height={16} />
      <Input />
      <Spacer height={8} />
      <TextButton text="Text Button" onPress={() => {}} />
      <Spacer height={8} />
      <TextButton text="Text Button" onPress={() => {}} disabled />
      <Spacer height={8} />
      <TextButton
        text="Text Button"
        onPress={() => {}}
        iconLeft="prevArrow"
        iconRight="nextArrow"
        variant="secondary"
      />
      <Spacer height={8} />
      <Toggle onToggleTap={onToggleTap} isEnabled={toggled} />
      <Spacer height={8} />
      <BBText variant="heading1">Heading1</BBText>
      <BBText variant="heading2">Heading2</BBText>
      <BBText variant="heading3">Heading3</BBText>
      <BBText variant="heading4">Heading4</BBText>
      <BBText variant="heading5">Heading5</BBText>
      <BBText variant="heading6">Heading6</BBText>
      <BBText variant="bodyXLRegular">BodyXLRegular</BBText>
      <BBText variant="bodyXLBold">BodyXLBold</BBText>
      <BBText variant="bodyXLSemiBold">BodyXLSemiBold</BBText>
      <BBText variant="bodyXLMedium">BodyXLMedium</BBText>
      <BBText variant="bodyLGRegular">BodyLGRegular</BBText>
      <BBText variant="bodyLGBold">BodyLGBold</BBText>
      <BBText variant="bodyLGSemiBold">BodyLGSemiBold</BBText>
      <BBText variant="bodyLGMedium">bodyLGMedium</BBText>
      <BBText variant="bodyMDRegular">BodyMDRegular</BBText>
      <BBText variant="bodyMDBold">BodyMDBold</BBText>
      <BBText variant="bodyMDSemiBold">BodyMDSemiBold</BBText>
      <BBText variant="bodyMDMedium">BodyMDMedium</BBText>
      <BBText variant="bodySMRegular">BodySMRegular</BBText>
      <BBText variant="bodySMBold">BodySMBold</BBText>
      <BBText variant="bodySMSemiBold">BodySMSemiBold</BBText>
      <BBText variant="bodySMMedium">bodySMMedium</BBText>
      <BBText variant="bodyXSRegular">BodyXSRegular</BBText>
      <BBText variant="bodyXSBold">BodyXSBold</BBText>
      <BBText variant="bodyXSSemiBold">BodyXSSemiBold</BBText>
      <BBText variant="bodyXSMedium">BodyXSMedium</BBText>
      <Spacer height={8} />
      <Chip variant="lg" text="Large" />
      <Spacer height={8} />
      <Chip variant="md" text="Medium" />
      <Spacer height={8} />
      <Chip variant="sm" text="Small" iconRight="closeSquare" />
      <Spacer height={8} />
      <Chip variant="lg" text="Large" invert iconLeft="star" />
      <Spacer height={8} />
      <Chip variant="md" text="Medium" invert />
      <Spacer height={8} />
      <Chip variant="sm" text="Small" invert />
      <Spacer height={8} />
      <CheckBox onTap={onCheckBoxTap} checked={checked} />
      <Spacer height={16} safeBottom />
    </ScrollView>
  );
}
