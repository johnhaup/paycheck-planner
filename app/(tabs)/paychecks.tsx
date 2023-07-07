import "react-native-gesture-handler";

import { billsAtom, totalBillsAtom } from "@atoms";
import { VariantText } from "@components";
import { Feather } from "@expo/vector-icons";
import { useThemeColor } from "@styles";
import { Bill } from "@types";
import dayjs from "dayjs";
import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { atom, useAtomValue } from "jotai";
import React from "react";
import { FlatList, ListRenderItemInfo, StyleSheet, View } from "react-native";
import { Spacer } from "react-native-spacer-view";

const paycheckAtom = atom<number>(1000);
const cashAtom = atom<number>((get) => get(paycheckAtom) - get(totalBillsAtom));

function Header() {
  const backgroundColor = useThemeColor("primary");
  const paycheck = useAtomValue(paycheckAtom);

  return (
    <View style={[styles.headerContainer, { backgroundColor }]}>
      <StatusBar style="light" />
      <Spacer safeTop height={16} />
      <VariantText variant="heading3" themeColor="textInverse">
        {dayjs().format("M/D/YY")}
      </VariantText>
      <View style={styles.headerContentContainer}>
        <VariantText variant="heading5" themeColor="textInverse">
          Income
        </VariantText>
        <VariantText variant="heading5" themeColor="textInverse">
          {paycheck}
        </VariantText>
      </View>
    </View>
  );
}

export default function PayPeriods() {
  const bills = useAtomValue(billsAtom);
  const cash = useAtomValue(cashAtom);

  const renderBill = ({ item: bill, index }: ListRenderItemInfo<Bill>) => {
    return (
      <View key={`pay_bill_${index}`} style={styles.billContainer}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <VariantText variant="heading6">{bill.name}</VariantText>
          <Link
            href={{
              pathname: "/webview",
              params: { name: bill.name, uri: encodeURIComponent(bill.link) },
            }}
            style={styles.linkIconContainer}
          >
            <Feather name="external-link" size={24} color="black" />
          </Link>
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
