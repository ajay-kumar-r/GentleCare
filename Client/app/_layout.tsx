import 'use-latest-callback';
import { useEffect } from 'react';
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
import notificationService from "../services/notificationService";

export default function Layout() {
  let [fontsLoaded] = useFonts({ Poppins_700Bold, Poppins_400Regular });

  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme === "dark");

  // Initialize notifications
  useEffect(() => {
    const initNotifications = async () => {
      try {
        // Register for push notifications
        await notificationService.registerForPushNotifications();
        
        // Set up listeners
        notificationService.setupNotificationListeners();
        
        // Start periodic checks for smart notifications
        notificationService.startPeriodicChecks();
        
        console.log('Notification service initialized');
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initNotifications();

    // Cleanup on unmount
    return () => {
      notificationService.cleanup();
    };
  }, []);

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
