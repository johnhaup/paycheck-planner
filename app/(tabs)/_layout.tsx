import { FontAwesome5 } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function Layout() {
  return (
    <Tabs
      screenOptions={() => ({
        headerShown: false,
      })}
    >
      <Tabs.Screen
        name="paychecks"
        options={{
          title: "Paychecks",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="money-check" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bills"
        options={{
          title: "Bills",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5
              name="file-invoice-dollar"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
