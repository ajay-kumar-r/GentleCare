import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Text, Avatar, useTheme, Card } from "react-native-paper";
import { useRouter } from "expo-router";
import QuickAccessCard from "../components/Elder/QuickAccessCard";
import NotificationItem from "../components/Elder/NotificationItem";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

export default function ElderDashboard() {
  const { colors } = useTheme();
  const router = useRouter();

  const notifications = [
    "Doctor appointment scheduled for tomorrow at 10 AM.",
    "Time to take your morning medication.",
    "John (caretaker) sent you a message.",
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Avatar.Image size={55} source={require("../../assets/images/elder-icon.png")} />
        <Text style={[styles.welcomeText, { color: colors.primary }]}>Welcome, John Doe</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, styles.quickAccessTitle, { color: colors.primary }]}>
          Quick Access
        </Text>
        <View style={styles.cardContainer}>
          <QuickAccessCard
            title="Health Tracking"
            icon="heart-pulse"
            color="#E57373"
            onPress={() => router.push("/elder/HealthTracking")}
          />
          <QuickAccessCard
            title="Medication"
            icon="pill"
            color="#64B5F6"
            onPress={() => router.push("/elder/Medications")}
          />
          <QuickAccessCard
            title="Meal Tracker"
            icon="food-apple"
            color="#81C784"
            onPress={() => router.push("/elder/MealTracker")}
          />
          <QuickAccessCard
            title="Social Connect"
            icon="account-group"
            color="#FFD54F"
            onPress={() => router.push("/elder/SocialConnect")}
          />
        </View>

        <View style={styles.notificationsHeader}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Notifications</Text>
          <TouchableOpacity onPress={() => router.push("/elder/Notifications")}>
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

      <TouchableOpacity style={styles.chatbotButton} onPress={() => router.push("/elder/Chatbot")}>
        <Ionicons name="chatbubble-ellipses" size={30} color="white" />
      </TouchableOpacity>
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
  chatbotButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#007AFF",
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
});
