import { billsMapAtom } from "@atoms";
import { Accordion } from "@components";
import { Input } from "@components";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { Bill } from "@types";
import dayjs from "dayjs";
import { useSearchParams } from "expo-router";
import { useAtomValue } from "jotai";
import React, { useState } from "react";
import { Dimensions, ScrollView, StyleSheet } from "react-native";
import { Spacer } from "react-native-spacer-view";

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

  const updateBill = (key: keyof Bill, value: string | number | Date) => {
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
    <ScrollView style={styles.container}>
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
      <Spacer height={8} />
      <Accordion
        label={`Start Date: ${dayjs(bill.startDate).format("M/D/YY")}`}
      >
        <DateTimePicker
          style={{ width: Dimensions.get("window").width - 32 }}
          value={bill.startDate}
          mode={"date"}
          display="inline"
          onChange={(_, date) => {
            if (date) {
              updateBill("startDate", date);
            }
          }}
        />
      </Accordion>
      <Spacer height={8} />
      <Accordion
        label={`End Date: ${
          bill.endDate ? dayjs(bill.endDate).format("M/D/YY") : "None"
        }`}
      >
        <DateTimePicker
          style={{ width: Dimensions.get("window").width - 32 }}
          value={bill.endDate || new Date()}
          display="inline"
          onChange={(_, date) => {
            if (date) {
              updateBill("endDate", date);
            }
          }}
        />
      </Accordion>
      <Spacer height={16} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
});
