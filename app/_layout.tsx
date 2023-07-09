import { Ionicons } from "@expo/vector-icons";
import { Stack, useNavigation } from "expo-router";
import { Pressable } from "react-native";

export default function Layout() {
  const { goBack } = useNavigation();

  return (
    <Stack>
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="webview"
        options={({ route }: { route: { params: { name: string } } }) => ({
          presentation: "modal",
          headerTitle: route.params.name,
          headerRight: () => (
            <Pressable onPress={goBack}>
              <Ionicons name="md-close" size={24} color="black" />
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        name="edit-bill"
        options={({ route }: { route: { params: { name: string } } }) => ({
          presentation: "modal",
          headerTitle: "Bill",
          headerRight: () => (
            <Pressable onPress={goBack}>
              <Ionicons name="md-close" size={24} color="black" />
            </Pressable>
          ),
        })}
      />
    </Stack>
  );
}
