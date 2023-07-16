import {
  activePayDateAtom,
  billsArrayAtom,
  payStartDateAtom,
  totalBillsAtom,
} from "@atoms";
import { NavButton, VariantText } from "@components";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { useThemeColor } from "@styles";
import { Bill } from "@types";
import dayjs from "dayjs";
import { StatusBar } from "expo-status-bar";
import { atom, useAtom, useAtomValue } from "jotai";
import React, { useEffect, useRef } from "react";
import { FlatList, ListRenderItemInfo, StyleSheet, View } from "react-native";
import { Spacer } from "react-native-spacer-view";

import { getBillsForPayPeriod, getLatestPayDate } from "../../utils";

const paycheckAtom = atom<number>(1000);
const cashAtom = atom<number>((get) => get(paycheckAtom) - get(totalBillsAtom));

function Header() {
  const _isMounted = useRef(false);
  const backgroundColor = useThemeColor("primary");
  const [activePayDate, setActivePayDate] = useAtom(activePayDateAtom);
  const initialPayDate = useAtomValue(payStartDateAtom);

  useEffect(() => {
    if (!_isMounted.current) {
      _isMounted.current = true;
      setActivePayDate(getLatestPayDate(initialPayDate));
    }
  }, [initialPayDate, setActivePayDate]);

  return (
    <View style={[styles.headerContainer, { backgroundColor }]}>
      <StatusBar style="light" />
      <Spacer safeTop height={16} />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <FontAwesome5 name="chevron-circle-left" size={24} color="white" />
          <Spacer width={12} />
          <VariantText variant="heading3" themeColor="textInverse">
            {dayjs(activePayDate).format("M/D/YY")}
          </VariantText>
          <Spacer width={12} />
          <FontAwesome5 name="chevron-circle-right" size={24} color="white" />
        </View>
        <FontAwesome5 name="calendar-alt" size={24} color="white" />
      </View>
      <Spacer height={8} />
    </View>
  );
}

const payPeriodBillsAtom = atom((get) => {
  const bills = get(billsArrayAtom);
  const activePayDate = get(activePayDateAtom);

  return getBillsForPayPeriod(activePayDate, bills);
});

export default function PayPeriods() {
  const bills = useAtomValue(payPeriodBillsAtom);
  const cash = useAtomValue(cashAtom);

  const renderBill = ({ item: bill, index }: ListRenderItemInfo<Bill>) => {
    return (
      <View key={`pay_bill_${index}`} style={styles.billContainer}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <VariantText variant="heading6">{bill.name}</VariantText>
          <NavButton
            href={{
              pathname: "webview",
              params: { name: bill.name, uri: encodeURIComponent(bill.link) },
            }}
            style={styles.linkIconContainer}
          >
            <Feather name="external-link" size={24} color="black" />
          </NavButton>
        </View>
        <VariantText key={bill.name} variant="bodyXLSemiBold">
          {bill.amount}
        </VariantText>
      </View>
    );
  };

  return (
    <>
      <FlatList
        data={bills}
        renderItem={renderBill}
        ListHeaderComponent={Header}
        stickyHeaderIndices={[0]}
      />
      <View style={styles.footerContainer}>
        <VariantText variant="heading5">Spending Cash</VariantText>
        <VariantText variant="heading5">{cash}</VariantText>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
  },
  headerContentContainer: {
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  billContainer: {
    width: "100%",
    borderBottomWidth: 1,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  linkIconContainer: { padding: 8 },
  footerContainer: {
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
  },
});
