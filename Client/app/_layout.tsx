import {
  useFonts,
  Poppins_700Bold,
  Poppins_400Regular,
} from "@expo-google-fonts/poppins";
import { useColorScheme, ActivityIndicator, StatusBar, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import { Slot } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { getTheme } from "./components/theme";

export default function Layout() {
  let [fontsLoaded] = useFonts({ Poppins_700Bold, Poppins_400Regular });

  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme === "dark");

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={{ colors: theme }}>
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <StatusBar
            barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
            backgroundColor="transparent"
            translucent
          />
          <Slot />
        </View>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
