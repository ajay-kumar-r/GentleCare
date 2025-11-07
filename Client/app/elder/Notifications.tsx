import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import BackButton from "../components/BackButton";
import { notificationAPI } from "../../services/api";
import notificationService, { SmartNotification } from "../../services/notificationService";
import CustomCard from "../components/CustomCard";

interface Notification {
  id: number | string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function Notifications() {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
    
    // Refresh every 30 seconds to show new smart notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      // Get smart local notifications
      const smartNotifs = await notificationService.getNotifications();
      
      // Get backend notifications
      const response = await notificationAPI.getAll();
      const backendNotifs = response.notifications || [];
      
      // Combine both sources - smart notifications first (newer), then backend
      const combinedNotifs: Notification[] = [
        ...smartNotifs.map(n => ({
          id: n.id,
          message: `${n.title}: ${n.message}`,
          type: n.type,
          is_read: n.isRead,
          created_at: n.timestamp,
        })),
        ...backendNotifs.map((n: any) => ({
          id: n.id,
          message: n.message,
          type: n.type || 'notification',
          is_read: n.is_read,
          created_at: n.created_at,
        })),
      ];
      
      // If no notifications, show sample data
      if (combinedNotifs.length === 0) {
        setNotifications([
          {
            id: -1,
            message: "Time to take your medication: Paracetamol 500mg",
            type: "medication",
            is_read: false,
            created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          },
          {
            id: -2,
            message: "Upcoming appointment with Dr. Emily Thompson tomorrow at 2:00 PM",
            type: "appointment",
            is_read: false,
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: -3,
            message: "Your blood pressure reading looks good today!",
            type: "health",
            is_read: true,
            created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: -4,
            message: "Reminder: Schedule your monthly health checkup",
            type: "appointment",
            is_read: true,
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          },
        ]);
      } else {
        setNotifications(combinedNotifs);
      }
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      // Show sample data on error
      setNotifications([
        {
          id: -1,
          message: "Sample notification. Connect to server for real notifications.",
          type: "system",
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (notificationId: number | string) => {
    try {
      // If it's a smart notification (string ID), mark it locally
      if (typeof notificationId === 'string') {
        await notificationService.markAsRead(notificationId);
      } else {
        // Otherwise mark it on backend
        await notificationAPI.markRead(notificationId);
      }
      
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
    }
  };

  const clearAllNotifications = async () => {
    Alert.alert("Clear All", "Mark all notifications as read?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          for (const notif of notifications.filter(n => !n.is_read)) {
            await markAsRead(notif.id);
          }
        },
      },
    ]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "medication": return "medical";
      case "appointment": return "calendar";
      case "emergency": return "warning";
      default: return "notifications";
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BackButton />
      <View style={styles.header}>
        <View style={{ width: 28 }} />
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Notifications</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={clearAllNotifications}>
            <Ionicons name="checkmark-done-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <TouchableOpacity
              key={notif.id}
              onPress={() => !notif.is_read && markAsRead(notif.id)}
            >
              <CustomCard style={[
                styles.notificationCard,
                notif.is_read ? styles.readCard : {}
              ]}>
                <View style={styles.cardContent}>
                  <View style={styles.iconContainer}>
                    <Ionicons 
                      name={getNotificationIcon(notif.type)} 
                      size={24} 
                      color={notif.is_read ? "#999" : colors.primary} 
                    />
                  </View>
                  <View style={styles.messageContainer}>
                    <Text style={[
                      styles.message,
                      notif.is_read && styles.readMessage
                    ]}>
                      {notif.message}
                    </Text>
                    <Text style={styles.timestamp}>
                      {new Date(notif.created_at).toLocaleString()}
                    </Text>
                  </View>
                  {!notif.is_read && <View style={styles.unreadDot} />}
                </View>
              </CustomCard>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noNotifications}>
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
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: "#F5F5F5",
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
    color: "#666",
  },
  notificationCard: {
    marginBottom: 12,
    elevation: 2,
    backgroundColor: "#FFF",
  },
  readCard: {
    opacity: 0.7,
    backgroundColor: "#F8F8F8",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  messageContainer: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    marginBottom: 4,
    color: "#333",
  },
  readMessage: {
    color: "#999",
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
    fontFamily: "Poppins_400Regular",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4CAF50",
    marginLeft: 8,
  },
});
