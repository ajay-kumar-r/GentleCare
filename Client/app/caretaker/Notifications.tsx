import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import NotificationItem from "../components/Elder/NotificationItem"; 

export default function CaretakerNotifications() {
  const { colors } = useTheme();
  const router = useRouter();
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const storedNotifications = await AsyncStorage.getItem("caretaker_notifications");

        if (storedNotifications) {
          setNotifications(JSON.parse(storedNotifications));
        } else {
          const dummyData = [
            "Ravi missed his 2:00 PM medication.",
            "Fall detected at 3:10 PM near kitchen.",
            "New vitals update available.",
            "Dr. Mehta sent a message regarding next visit.",
            "Emergency button was triggered at 4:15 PM.",
          ];
          setNotifications(dummyData);
          await AsyncStorage.setItem("caretaker_notifications", JSON.stringify(dummyData));
        }
      } catch (error) {
        console.error("Error loading notifications:", error);
      }
    };

    loadNotifications();
  }, []);

  const deleteNotification = async (index: number) => {
    const updatedNotifications = notifications.filter((_, i) => i !== index);
    setNotifications(updatedNotifications);
    await AsyncStorage.setItem("caretaker_notifications", JSON.stringify(updatedNotifications));
  };

  const clearAllNotifications = async () => {
    Alert.alert("Clear All", "Are you sure you want to clear all notifications?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          setNotifications([]);
          await AsyncStorage.removeItem("caretaker_notifications");
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Notifications</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={clearAllNotifications}>
            <Ionicons name="trash-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {notifications.length > 0 ? (
          notifications.map((text, index) => (
            <TouchableOpacity
              key={index}
              onLongPress={() => {
                Alert.alert("Delete", "Delete this notification?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteNotification(index),
                  },
                ]);
              }}
            >
              <NotificationItem text={text} />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={[styles.noNotifications, { color: colors.text }]}>
            No notifications available.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  noNotifications: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    marginTop: 50,
  },
});
