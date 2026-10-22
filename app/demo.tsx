import { useEffect } from "react";
import { Redirect } from "expo-router";
import { useStore } from "@/store";
import { buildDemoData } from "@/utils/demoData";

// Inlined at build time; only screenshot builds (expo-local-ship screenshots capture --build) set it
const IS_STORE_DEMO = process.env.EXPO_PUBLIC_STORE_DEMO === "1";

export default function DemoScreen() {
  useEffect(() => {
    if (IS_STORE_DEMO) {
      useStore.setState(buildDemoData(new Date()));
    }
  }, []);

  return <Redirect href="/" />;
}
