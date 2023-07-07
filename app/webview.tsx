import "react-native-gesture-handler";

import { useFonts } from "expo-font";
import { useSearchParams } from "expo-router";
import React from "react";
import WebView from "react-native-webview";

export default function Webview() {
  const params = useSearchParams();

  const [fontsLoaded] = useFonts({
    "Urbanist-Bold": require("../assets/fonts/Urbanist-Bold.ttf"),
    "Urbanist-Medium": require("../assets/fonts/Urbanist-Medium.ttf"),
    "Urbanist-Regular": require("../assets/fonts/Urbanist-Regular.ttf"),
    "Urbanist-SemiBold": require("../assets/fonts/Urbanist-SemiBold.ttf"),
  });

  if (!fontsLoaded) {
    return null;
  }

  return <WebView style={{ flex: 1 }} source={{ uri: params.uri }} />;
}
