import "react-native-gesture-handler";

import { Picker } from "@react-native-picker/picker";
import dayjs from "dayjs";
import { useSearchParams } from "expo-router";
import { atom, useAtom, useAtomValue } from "jotai";
import { useImmerAtom } from "jotai-immer";
import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Spacer } from "react-native-spacer-view";

import { billsMapAtom } from "../atoms";
import { Accordion } from "../components";
import { Input } from "../components/Input";
import { Bill } from "../types";

const monthDates = new Array(31)
  .fill(0)
  .map((_, i) => i + 1)
  .map((value) => ({
    label: dayjs(`1981-${value}-01`, "YYYY-D-MM").format("Do"),
    value,
  }));

const useEditBillState = () => {
  const params = useSearchParams<{ id: string }>();
  const staleBill = useAtomValue(billsMapAtom)[params.id];
  const [bill, setBill] = useState<Bill>(staleBill);

  const updateBill = (key: keyof Bill, value: string | number) => {
    setBill((prev) => ({ ...prev, [key]: value }));
  };

  return {
    bill,
    updateBill,
  };
};

export default function EditBill() {
  const { bill, updateBill } = useEditBillState();

  return (
    <View style={styles.container}>
      <Spacer height={16} />
      <Input
        label="Name"
        value={bill?.name}
        onChangeText={(t) => updateBill("name", t)}
      />
      <Spacer height={16} />
      <Input
        label="Amount"
        value={bill?.amount.toString()}
        onChangeText={(t) => updateBill("amount", Number(t))}
      />
      <Spacer height={16} />

      <Accordion
        label={`Due Date: ${dayjs(
          `1981-${bill.dueDate}-01`,
          "YYYY-D-MM"
        ).format("Do")}`}
      >
        <Picker
          style={{ width: Dimensions.get("window").width - 32 }}
          selectedValue={bill.dueDate}
          onValueChange={(itemValue) => updateBill("dueDate", itemValue)}
        >
          {monthDates.map((date) => (
            <Picker.Item key={date.value} {...date} />
          ))}
        </Picker>
      </Accordion>
      <Spacer height={16} />
      <Input
        label="Start Date"
        value={dayjs(bill.startDate).format("M/D/YY")}
      />
      <Spacer height={16} />
      <Input
        label="End Date"
        value={bill.endDate ? dayjs(bill.endDate).format("M/D/YY") : ""}
      />
      <Spacer height={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
});
