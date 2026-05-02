import { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { Text, Avatar, useTheme } from "react-native-paper";
import CustomCard from "../components/CustomCard";
import { useRouter } from "expo-router";
import QuickAccessCard from "../components/Elder/QuickAccessCard";
import NotificationItem from "../components/Elder/NotificationItem";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { dashboardAPI, socketService } from "../../services/api";

export default function ElderDashboard() {
  const { colors } = useTheme();
  const router = useRouter();
  const [userName, setUserName] = useState("...");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [medications, setMedications] = useState({ total: 0, taken_today: 0 });
  const [appointments, setAppointments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await dashboardAPI.getSummary();
      setUserName(data.user_name || "User");
      setMedications(data.medications || { total: 0, taken_today: 0 });
      setAppointments(data.upcoming_appointments || []);
      setNotifications(data.notifications || []);
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
    socketService.on('notification_created', refresh);
    socketService.on('health_record_added', refresh);
    return () => {
      socketService.off('medication_logged', refresh);
      socketService.off('notification_created', refresh);
      socketService.off('health_record_added', refresh);
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
        <Avatar.Image size={55} source={require("../../assets/images/elder-icon.png")} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.welcomeText, { color: colors.primary }]}>Welcome, {userName.split(' ')[0]}</Text>
          <Text style={[styles.subText, { color: (colors as any).textSecondary || "#666" }]}>
            {medications.taken_today}/{medications.total} medications taken today
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface || "#1A1D21" }]}>
            Quick Access
          </Text>
          <View style={styles.cardContainer}>
            <QuickAccessCard title="Health Tracking" icon="heart-pulse" color="#E57373" onPress={() => router.push("/elder/HealthTracking")} />
            <QuickAccessCard title="Medication" icon="pill" color="#64B5F6" onPress={() => router.push("/elder/Medications")} />
            <QuickAccessCard title="Meal Tracker" icon="food-apple" color="#81C784" onPress={() => router.push("/elder/MealTracker")} />
            <QuickAccessCard title="Appointments" icon="calendar" color="#9575CD" onPress={() => router.push("/elder/Appointments")} />
            <QuickAccessCard title="Prescriptions" icon="receipt" color="#4DB6AC" onPress={() => router.push("/elder/Prescriptions")} />
            <QuickAccessCard title="Emergency Contacts" icon="alert-circle" color="#F06292" onPress={() => router.push("/elder/EmergencyContacts")} />
            <QuickAccessCard title="AI Assistant" icon="robot" color="#FFD54F" onPress={() => router.push("/elder/SocialConnect")} />
          </View>
        </View>

        {appointments.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface || "#1A1D21" }]}>Upcoming Appointments</Text>
            {appointments.map((apt: any) => (
              <CustomCard key={apt.id} style={styles.appointmentCard}>
                <View style={styles.appointmentRow}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="calendar" size={24} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={[styles.appointmentTitle, { color: colors.onSurface || "#1A1D21" }]}>{apt.title}</Text>
                    <Text style={[styles.appointmentDate, { color: colors.onSurfaceVariant || "#666" }]}>
                      {new Date(apt.date).toLocaleDateString()} {apt.doctor ? `• Dr. ${apt.doctor}` : ""}
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.onSurfaceVariant || "#666"} />
                </View>
              </CustomCard>
            ))}
          </View>
        )}

        <View style={styles.sectionContainer}>
          <View style={styles.notificationsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface || "#1A1D21" }]}>Notifications</Text>
            <TouchableOpacity onPress={() => router.push("/elder/Notifications")}>
              <Text style={{ color: colors.primary, fontFamily: "Poppins_600SemiBold" }}>View All</Text>
            </TouchableOpacity>
          </View>

          <CustomCard style={styles.notificationsCard}>
            <View style={styles.notificationsListContainer}>
              {notifications.length > 0 ? (
                <ScrollView style={styles.notificationsList} contentContainerStyle={{ paddingVertical: 8 }} showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
                  {notifications.map((notif: any, index: number) => (
                    <NotificationItem key={notif.id || index} text={notif.message || notif.title || "Notification"} />
                  ))}
                </ScrollView>
              ) : (
                <Text style={[styles.noNotifText, { color: colors.onSurfaceVariant || "#999" }]}>No new notifications</Text>
              )}
            </View>
          </CustomCard>
        </View>
      </ScrollView>

      <TouchableOpacity style={[styles.chatbotButton, { backgroundColor: colors.primary }]} onPress={() => router.push("/elder/Chatbot")}>
        <Ionicons name="chatbubble-ellipses" size={30} color="white" />
      </TouchableOpacity>
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
  appointmentCard: {
    padding: 16,
    marginBottom: 12,
  },
  appointmentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  appointmentDate: {
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
  chatbotButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
});
