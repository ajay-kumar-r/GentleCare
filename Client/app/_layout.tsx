import { useFonts, Poppins_700Bold, Poppins_400Regular } from "@expo-google-fonts/poppins";
import { useColorScheme, ActivityIndicator } from "react-native";
import { PaperProvider } from "react-native-paper";
import { Slot } from "expo-router";
import { getTheme } from "./components/theme"; 

export default function Layout() {

  let [fontsLoaded] = useFonts({ Poppins_700Bold, Poppins_400Regular });

  const colorScheme = useColorScheme(); 
  const theme = getTheme(colorScheme === "dark"); 
  
  if (!fontsLoaded) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <PaperProvider theme={{ colors: theme }}>
      <Slot />
    </PaperProvider>
  );
}