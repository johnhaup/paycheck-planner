import { useEffect } from "react";
import { Redirect, useLocalSearchParams } from "expo-router";
import { IS_STORE_DEMO, useProStore } from "@/services/pro";
import { useStore } from "@/store";
import { buildStoreDemoData } from "@/utils/demoData";

/** `paycheck-planner://demo` loads the store sample budget with Pro on; `?short=1` leaves one paycheck short */
export default function DemoScreen() {
  const { short } = useLocalSearchParams<{ short?: string }>();

  useEffect(() => {
    if (IS_STORE_DEMO) {
      useStore.setState(buildStoreDemoData(new Date(), short === "1"));
      useProStore.getState().setIsPro(true);
    }
  }, [short]);

  return <Redirect href="/" />;
}
