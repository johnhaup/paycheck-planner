import { billsMapAtom } from "@atoms";
import { Accordion, TextButton } from "@components";
import { Input } from "@components";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { Bill } from "@types";
import dayjs from "dayjs";
import { useNavigation, useSearchParams } from "expo-router";
import { useAtomValue, useSetAtom } from "jotai";
import { useImmerAtom } from "jotai-immer";
import React, { useState } from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
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
  const [, saveBill] = useImmerAtom(billsMapAtom);
  const { goBack } = useNavigation();

  const onSavePress = () => {
    saveBill((map) => {
      map[bill.id] = bill;
    });
    goBack();
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ justifyContent: "center" }}
      >
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
            style={styles.calendar}
            value={bill.startDate}
            themeVariant="light"
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
            style={styles.calendar}
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
      <View style={styles.container}>
        <Spacer height={16} />
        <TextButton text="Save" onPress={onSavePress} />
        <Spacer height={16} safeBottom />
      </View>
    </>
  );
}

const PADDING = 16;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: PADDING,
  },
  calendar: {
    width: Dimensions.get("window").width - PADDING * 2,
  },
});
