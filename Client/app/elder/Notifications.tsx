import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Text, Card, IconButton, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NotificationItem from "../components/Elder/NotificationItem";
import { Ionicons } from "@expo/vector-icons";

export default function Notifications() {
  const { colors } = useTheme();
  const router = useRouter();
  const [notifications, setNotifications] = useState<string[]>([]);

  // Load notifications when the page opens
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Notifications</Text>
      </View>

      {/* Notifications List */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {notifications.length > 0 ? (
          notifications.map((text, index) => (
            <NotificationItem key={index} text={text} />
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
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    marginLeft: 10,
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
