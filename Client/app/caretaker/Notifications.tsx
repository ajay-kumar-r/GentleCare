import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Text, Card, useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import CustomSnackbar from "../components/CustomSnackbar";
import BackButton from "../components/BackButton";
import { notificationAPI, socketService } from "../../services/api";

interface Notification {
  id: number;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function CaretakerNotifications() {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await notificationAPI.getAll();
      const fetchedNotifications = response.notifications || [];
      setNotifications(fetchedNotifications);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
      showSnackbar(error.message || "Failed to load notifications");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const refreshFromRealtime = () => {
      fetchNotifications();
    };

    socketService.on('notification_created', refreshFromRealtime);

    return () => {
      socketService.off('notification_created');
    };
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.is_read) return;

    try {
      await notificationAPI.markRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
      showSnackbar("Notification marked as read");
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      showSnackbar(error.message || "Failed to update notification");
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMsg(message);
    setSnackbarVisible(true);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "medication":
        return "medical";
      case "appointment":
        return "calendar";
      case "emergency":
        return "warning";
      case "health":
        return "fitness";
      case "system":
        return "settings";
      default:
        return "notifications";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "medication":
        return "#2196F3";
      case "appointment":
        return "#4CAF50";
      case "emergency":
        return "#f44336";
      case "health":
        return "#FF9800";
      case "system":
        return "#9C27B0";
      default:
        return "#757575";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BackButton />
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              onPress={() => handleMarkAsRead(notification)}
              activeOpacity={0.7}
            >
              <Card style={[styles.card, { backgroundColor: colors.surface }, !notification.is_read && { borderLeftColor: colors.primary, borderLeftWidth: 4 }]}>
                <Card.Content style={styles.cardContent}>
                  <View style={styles.notificationRow}>
                    <View
                      style={[
                        styles.iconCircle,
                        { backgroundColor: getNotificationColor(notification.type || "system") + "20" },
                      ]}
                    >
                      <Ionicons
                        name={getNotificationIcon(notification.type || "system") as any}
                        size={24}
                        color={getNotificationColor(notification.type || "system")}
                      />
                    </View>
                    <View style={styles.notificationContent}>
                      <View style={styles.notificationTop}>
                        <Text style={[styles.notificationType, { color: colors.onSurfaceVariant || "#666" }]}>
                          {notification.type ? notification.type.charAt(0).toUpperCase() + notification.type.slice(1) : "Notification"}
                        </Text>
                        {!notification.is_read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
                      </View>
                      <Text style={[styles.notificationMessage, { color: colors.onSurface || "#333" }]}>{notification.message}</Text>
                      <Text style={[styles.timestamp, { color: colors.onSurfaceVariant || "#999" }]}>
                        {formatTimestamp(notification.created_at)}
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={[styles.noNotifications, { color: colors.onSurfaceVariant || "#999" }]}>No notifications available</Text>
        )}
      </ScrollView>

      <CustomSnackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)}>
        {snackbarMsg}
      </CustomSnackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
    position: "relative",
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
  },
  badge: {
    position: "absolute",
    right: 20,
    backgroundColor: "#f44336",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    marginBottom: 12,
    elevation: 0,
  },
  unreadCard: {
    borderLeftWidth: 4,
  },
  cardContent: {
    padding: 12,
  },
  notificationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  notificationType: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    lineHeight: 20,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
  noNotifications: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 50,
    fontFamily: "Poppins_400Regular",
  },
});
