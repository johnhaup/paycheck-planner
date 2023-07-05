import "react-native-gesture-handler";

import { BBText } from "components";
import dayjs from "dayjs";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ScrollView } from "react-native";
import { Spacer } from "react-native-spacer-view";
import { generatePayDates } from "../../hooks/usePaySchedule";

export function PayPeriods() {
  const payDates = generatePayDates(dayjs().toDate(), {
    type: "weeklyCadence",
    dayOfWeek: 5,
    everyXWeeks: 2,
  });

  const renderPayPeriod = (payDate: Date) => {
    return (
      <BBText key={payDate.toISOString()} variant="heading5">
        {dayjs(payDate).format("M/D/YY")}
      </BBText>
    );
  };

  return (
    <ScrollView style={{ paddingHorizontal: 16 }}>
      <StatusBar style="auto" />
      <Spacer safeTop height={16} />
      {payDates.map(renderPayPeriod)}
      <Spacer height={16} safeBottom />
    </ScrollView>
  );
}
