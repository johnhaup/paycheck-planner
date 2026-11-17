import { useEffect } from "react";
import { Redirect } from "expo-router";
import { IS_STORE_DEMO, useProStore } from "@/services/pro";
import { useStore } from "@/store";
import { buildDemoData } from "@/utils/demoData";

export default function DemoScreen() {
  useEffect(() => {
    if (IS_STORE_DEMO) {
      useStore.setState(buildDemoData(new Date()));
      useProStore.getState().setIsPro(true);
    }
  }, []);

  return <Redirect href="/" />;
}
