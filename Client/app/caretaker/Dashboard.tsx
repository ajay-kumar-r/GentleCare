import { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from "react-native";
import { Text, Avatar, useTheme } from "react-native-paper";
import CustomCard from "../components/CustomCard";
import { useRouter } from "expo-router";
import QuickAccessCard from "../components/Caretaker/QuickAccessCard";
import NotificationItem from "../components/Caretaker/NotificationItem";
import { MaterialIcons } from "@expo/vector-icons";
import { dashboardAPI, socketService } from "../../services/api";

export default function CaretakerDashboard() {
  const { colors } = useTheme();
  const router = useRouter();
  const [userName, setUserName] = useState("...");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [elders, setElders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await dashboardAPI.getSummary();
      setUserName(data.user_name || "Caretaker");
      setNotifications(data.notifications || []);
      setElders(data.elders || []);
    } catch (error: any) {
      console.error("Dashboard load error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    const refresh = () => loadDashboard();
    socketService.on('medication_logged', refresh);
    socketService.on('elder_linked', refresh);
    socketService.on('notification_created', refresh);
    
    const handleEmergencyAlert = (data: any) => {
      Alert.alert(
        "EMERGENCY ALERT!",
        `Critical event detected for ${data.elder_name}:\n${data.alert_type}`,
        [{ text: "Acknowledge", style: "destructive" }]
      );
    };
    socketService.on('emergency_alert', handleEmergencyAlert);

    return () => {
      socketService.off('medication_logged', refresh);
      socketService.off('elder_linked', refresh);
      socketService.off('notification_created', refresh);
      socketService.off('emergency_alert', handleEmergencyAlert);
    };
  }, [loadDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Avatar.Image size={55} source={require("../../assets/images/caretaker-icon.png")} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.welcomeText, { color: colors.primary }]}>Welcome, {userName.split(' ')[0]}</Text>
          <Text style={[styles.subText, { color: (colors as any).textSecondary || "#666" }]}>
            Managing {elders.length} elder{elders.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Elder summary cards */}
        {elders.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface || "#1A1D21" }]}>Your Elders</Text>
            {elders.map((elder: any) => (
              <CustomCard key={elder.id} style={styles.elderCard}>
                <View style={styles.elderRow}>
                  <Avatar.Icon size={48} icon="account" style={{ backgroundColor: colors.primary + '15' }} color={colors.primary} />
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={[styles.elderName, { color: colors.onSurface || "#1A1D21" }]}>{elder.name}</Text>
                    <Text style={[styles.elderMeta, { color: colors.onSurfaceVariant || "#666" }]}>
                      {elder.active_medications} medications • {elder.upcoming_appointments} appointments
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.onSurfaceVariant || "#666"} />
                </View>
              </CustomCard>
            ))}
          </View>
        )}

        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface || "#1A1D21" }]}>
            Quick Access
          </Text>
          <View style={styles.cardContainer}>
            <QuickAccessCard title="Health Records" icon="heart" color="#E57373" onPress={() => router.push("/caretaker/HealthRecords")} />
            <QuickAccessCard title="Appointments" icon="calendar" color="#64B5F6" onPress={() => router.push("/caretaker/Appointments")} />
            <QuickAccessCard title="Medications" icon="medkit" color="#81C784" onPress={() => router.push("/caretaker/Medications")} />
            <QuickAccessCard title="Meal Tracker" icon="food-apple" color="#FFB74D" onPress={() => router.push("/caretaker/MealTracker")} />
            <QuickAccessCard title="Emergency Contacts" icon="alert-circle" color="#FFD54F" onPress={() => router.push("/caretaker/EmergencyContacts")} />
            <QuickAccessCard title="Prescriptions" icon="receipt" color="#9575CD" onPress={() => router.push("/caretaker/Prescriptions")} />
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.notificationsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface || "#1A1D21" }]}>Notifications</Text>
            <TouchableOpacity onPress={() => router.push("/caretaker/Notifications")}>
              <Text style={{ color: colors.primary, fontFamily: "Poppins_600SemiBold" }}>View All</Text>
            </TouchableOpacity>
          </View>

          <CustomCard style={styles.notificationsCard}>
            <View style={styles.notificationsListContainer}>
              {notifications.length > 0 ? (
                <ScrollView style={styles.notificationsList} contentContainerStyle={{ paddingVertical: 8 }} showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
                  {notifications.map((notif: any, index: number) => {
                    const date = new Date(notif.created_at);
                    const now = new Date();
                    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
                    const timeStr = diffMins < 1 ? 'Just now' : diffMins < 60 ? `${diffMins}m ago` : `${Math.floor(diffMins/60)}h ago`;
                    
                    return (
                      <NotificationItem 
                        key={notif.id || index} 
                        text={notif.message || notif.title} 
                        type={notif.type}
                        time={timeStr}
                      />
                    );
                  })}
                </ScrollView>
              ) : (
                <Text style={[styles.noNotifText, { color: colors.onSurfaceVariant || "#999" }]}>No new notifications</Text>
              )}
            </View>
          </CustomCard>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
    gap: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
  },
  subText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    marginBottom: 16,
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 16,
  },
  elderCard: {
    padding: 16,
    marginBottom: 12,
  },
  elderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  elderName: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
  elderMeta: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    marginTop: 2,
  },
  notificationsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  notificationsCard: {
    padding: 16,
  },
  notificationsListContainer: {
    maxHeight: 200,
  },
  notificationsList: {
    flexGrow: 1,
  },
  noNotifText: {
    textAlign: "center",
    paddingVertical: 32,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
  },
});
