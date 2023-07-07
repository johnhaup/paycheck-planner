import "react-native-gesture-handler";

import { useSearchParams } from "expo-router";
import React from "react";
import WebView from "react-native-webview";

export default function Webview() {
  const params = useSearchParams();

  return <WebView style={{ flex: 1 }} source={{ uri: params.uri }} />;
}
