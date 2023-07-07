import "react-native-gesture-handler";

import { billsAtom, totalBillsAtom } from "@atoms";
import { BBText } from "@components";
import { Feather } from "@expo/vector-icons";
import { useThemeColor } from "@styles";
import { Bill } from "@types";
import dayjs from "dayjs";
import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { atom, useAtomValue } from "jotai";
import React from "react";
import { FlatList, ListRenderItemInfo, View } from "react-native";
import { Spacer } from "react-native-spacer-view";

const paycheckAtom = atom<number>(1000);

const cashAtom = atom<number>((get) => get(paycheckAtom) - get(totalBillsAtom));

function Header() {
  const backgroundColor = useThemeColor("primary");
  const paycheck = useAtomValue(paycheckAtom);

  return (
    <View style={{ backgroundColor, paddingHorizontal: 16 }}>
      <StatusBar style="auto" />
      <Spacer safeTop height={16} />
      <BBText variant="heading3" themeColor="textInverse">
        {dayjs().format("M/D/YY")}
      </BBText>
      <View
        style={{
          width: "100%",
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "space-between",
          paddingVertical: 8,
        }}
      >
        <BBText variant="heading5" themeColor="textInverse">
          Income
        </BBText>
        <BBText variant="heading5" themeColor="textInverse">
          {paycheck}
        </BBText>
      </View>
    </View>
  );
}

export function PayPeriods() {
  const bills = useAtomValue(billsAtom);
  const cash = useAtomValue(cashAtom);

  const renderBill = ({ item: bill }: ListRenderItemInfo<Bill>) => {
    return (
      <View
        style={{
          width: "100%",
          borderBottomWidth: 1,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "space-between",
          paddingVertical: 8,
          paddingHorizontal: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <BBText key={bill.name} variant="heading6">
            {bill.name}
          </BBText>
          <Link
            href={{
              pathname: "/webview",
              params: { name: bill.name, uri: encodeURIComponent(bill.link) },
            }}
            style={{ padding: 8 }}
          >
            <Feather name="external-link" size={24} color="black" />
          </Link>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <BBText key={bill.name} variant="bodyXLSemiBold">
            {bill.amount}
          </BBText>
        </View>
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
      <View style={{ padding: 16, borderTopWidth: 1 }}>
        <View
          style={{
            width: "100%",
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <BBText variant="heading5">Spending Cash</BBText>
          <BBText variant="heading5">{cash}</BBText>
        </View>
        <Spacer safeBottom />
      </View>
    </>
  );
}
