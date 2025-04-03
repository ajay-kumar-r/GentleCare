import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Text, IconButton, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NotificationItem from "../components/Elder/NotificationItem";
import { Ionicons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";

export default function Notifications() {
  const { colors } = useTheme();
  const router = useRouter();
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const storedNotifications = await AsyncStorage.getItem("notifications");
        if (storedNotifications) {
          setNotifications(JSON.parse(storedNotifications));
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
    await AsyncStorage.setItem("notifications", JSON.stringify(updatedNotifications));
  };

  const clearAllNotifications = async () => {
    Alert.alert("Clear All", "Are you sure you want to clear all notifications?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          setNotifications([]);
          await AsyncStorage.removeItem("notifications");
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
            <Swipeable
              key={index}
              renderRightActions={() => (
                <TouchableOpacity
                  onPress={() => deleteNotification(index)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash" size={24} color="red" />
                </TouchableOpacity>
              )}
            >
              <NotificationItem text={text} />
            </Swipeable>
          ))
        ) : (
          <Text style={[styles.noNotifications, { color: colors.text }]}>
            No new notifications.
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
  deleteButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 60,
    height: "100%",
    borderRadius: 10,
  },
});
