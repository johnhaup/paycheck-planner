import "react-native-gesture-handler";

import { billsAtom } from "@atoms";
import { VariantText } from "@components";
import { useThemeColor } from "@styles";
import { Bill } from "@types";
import dayjs from "dayjs";
import { StatusBar } from "expo-status-bar";
import { useAtomValue } from "jotai";
import React from "react";
import { FlatList, ListRenderItemInfo, StyleSheet, View } from "react-native";
import { Spacer } from "react-native-spacer-view";

function Header() {
  const backgroundColor = useThemeColor("primary");

  return (
    <View style={[styles.headerContainer, { backgroundColor }]}>
      <StatusBar style="light" />
      <Spacer safeTop height={16} />
      <VariantText variant="heading3" themeColor="textInverse">
        Bills
      </VariantText>
      <Spacer height={16} />
    </View>
  );
}

function BillProperty({ title, value }: { title: string; value?: string }) {
  if (!value) {
    return null;
  }

  return (
    <View style={styles.billPropertyContainer}>
      <VariantText variant="bodyMDBold">{title}</VariantText>
      <Spacer width={8} />
      <VariantText variant="bodyMDRegular">{value}</VariantText>
    </View>
  );
}

export default function PayPeriods() {
  const bills = useAtomValue(billsAtom);

  const renderBill = ({ item: bill, index }: ListRenderItemInfo<Bill>) => {
    return (
      <View key={`bill_${index}`} style={styles.billCardContainer}>
        <VariantText key={bill.name} variant="heading6">
          {bill.name}
        </VariantText>
        <BillProperty title="Amount" value={`${bill.amount}`} />
        <BillProperty
          title="Due Date"
          value={dayjs(`1981-${bill.dueDate}-01`, "YYYY-D-MM").format("Do")}
        />
        <BillProperty
          title="Start Date"
          value={dayjs(bill.startDate).format("M/D/YY")}
        />
        {bill.endDate && (
          <BillProperty
            title="End Date"
            value={dayjs(bill.endDate).format("M/D/YY")}
          />
        )}
      </View>
    );
  };

  return (
    <FlatList
      data={bills}
      renderItem={renderBill}
      ListHeaderComponent={Header}
      ItemSeparatorComponent={() => <Spacer height={8} />}
      stickyHeaderIndices={[0]}
    />
  );
}

const styles = StyleSheet.create({
  headerContainer: { paddingHorizontal: 16, marginBottom: 16 },
  billCardContainer: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
  },
  billPropertyContainer: {
    alignItems: "center",
    flexDirection: "row",
  },
});
