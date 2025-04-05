import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Text, Avatar, useTheme, Card } from "react-native-paper";
import { useRouter } from "expo-router";
import QuickAccessCard from "../components/Caretaker/QuickAccessCard";
import NotificationItem from "../components/Caretaker/NotificationItem";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

export default function CaretakerDashboard() {
  const { colors } = useTheme();
  const router = useRouter();

  const notifications = [
    "Doctor appointment scheduled for tomorrow at 10 AM.",
    "Medication reminder: It's time to give your elder their medication.",
    "John (elder) sent you a message.",
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Avatar.Image size={55} source={require("../../assets/images/caretaker-icon.png")} />
        <Text style={[styles.welcomeText, { color: colors.primary }]}>Welcome, Ram (Caretaker)</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, styles.quickAccessTitle, { color: colors.primary }]}>
          Quick Access
        </Text>
        <View style={styles.cardContainer}>
          <QuickAccessCard
            title="Health Records"
            icon="heart"
            color="#E57373"
            onPress={() => router.push("/caretaker/HealthRecords")}
          />
          <QuickAccessCard
            title="Appointments"
            icon="calendar"
            color="#64B5F6"
            onPress={() => router.push("/caretaker/Appointments")}
          />
          <QuickAccessCard
            title="Medications"
            icon="medkit"
            color="#81C784"
            onPress={() => router.push("/caretaker/Medications")}
          />
          <QuickAccessCard
            title="Emergency Alerts"
            icon="alert-circle"
            color="#FFD54F"
            onPress={() => router.push("/caretaker/EmergencyAlerts")}
          />
          <QuickAccessCard
            title="Prescriptions"
            icon="receipt"
            color="#9575CD"
            onPress={() => router.push("/caretaker/Prescriptions")}
          />
          <QuickAccessCard
            title="Location Tracker"
            icon="location"
            color="#4DB6AC"
            onPress={() => router.push("/caretaker/LocationTracker")}
          />
        </View>


        <View style={styles.notificationsHeader}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Notifications</Text>
          <TouchableOpacity onPress={() => router.push("/caretaker/Notifications")}>
            <MaterialIcons
              name="arrow-forward-ios"
              size={22}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        <Card style={styles.notificationsCard}>
          <View style={styles.notificationsListContainer}>
            <ScrollView
              style={styles.notificationsList}
              contentContainerStyle={{ paddingVertical: 10 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
              {notifications.map((notif, index) => (
                <NotificationItem key={index} text={notif} />
              ))}
            </ScrollView>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 5,
    gap: 10,
  },
  welcomeText: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    marginVertical: 10,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  quickAccessTitle: {
    fontSize: 22,
    textAlign: "center",
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 20,
  },
  notificationsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 1,
    alignItems: "center",
    marginTop: 10,
  },
  notificationsCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    elevation: 3,
  },
  notificationsListContainer: {
    maxHeight: 150,
    flex: 1,
  },
  notificationsList: {
    flexGrow: 1,
  },
});
