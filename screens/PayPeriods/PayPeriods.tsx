import "react-native-gesture-handler";

import { BBText } from "@components";
import { generatePayDates } from "@utils";
import dayjs from "dayjs";
import { StatusBar } from "expo-status-bar";
import { atom, useAtom } from "jotai";
import React from "react";
import { ScrollView } from "react-native";
import { Spacer } from "react-native-spacer-view";

type Bill = {
  name: string;
  amount: number;
  dueDate: Date;
  link: string;
};

const bills = atom<Bill[]>([
  {
    amount: 100,
    dueDate: dayjs().add(1, "week").toDate(),
    link: "https://www.sce.com/",
    name: "Electric",
  },
]);

export function PayPeriods() {
  const payDates = generatePayDates(dayjs().toDate(), {
    type: "weeklyCadence",
    dayOfWeek: 5,
    everyXWeeks: 2,
  });

  const [billsValue, setBillValue] = useAtom(bills);

  const renderBill = (bill: Bill) => {
    return (
      <BBText key={bill.name} variant="heading6">
        {bill.name}
      </BBText>
    );
  };

  return (
    <ScrollView style={{ paddingHorizontal: 16 }}>
      <StatusBar style="auto" />
      <Spacer safeTop height={16} />
      <BBText variant="heading3">{dayjs().format("M/D/YY")}</BBText>
      {billsValue.map(renderBill)}
      <Spacer height={16} safeBottom />
    </ScrollView>
  );
}
