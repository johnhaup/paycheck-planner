import { Ionicons } from "@expo/vector-icons";
import { Stack, useNavigation } from "expo-router";
import { Pressable } from "react-native";

export default function Layout() {
  const { goBack } = useNavigation();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={() => ({
          headerShown: false,
        })}
      />
      <Stack.Screen
        name="webview"
        options={({ route }) => ({
          presentation: "modal",
          headerTitle: route.params.name,
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
