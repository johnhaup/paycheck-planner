import "react-native-gesture-handler";

import dayjs from "dayjs";
import { useFonts } from "expo-font";
import { getCalendars } from "expo-localization";
import React from "react";
import { PayPeriods } from "../screens";

import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
const calendar = getCalendars()[0];
dayjs.tz.setDefault(calendar.timeZone);

export default function App() {
  const [fontsLoaded] = useFonts({
    "Urbanist-Bold": require("../assets/fonts/Urbanist-Bold.ttf"),
    "Urbanist-Medium": require("../assets/fonts/Urbanist-Medium.ttf"),
    "Urbanist-Regular": require("../assets/fonts/Urbanist-Regular.ttf"),
    "Urbanist-SemiBold": require("../assets/fonts/Urbanist-SemiBold.ttf"),
  });

  if (!fontsLoaded) {
    return null;
  }

  return <PayPeriods />;
}
