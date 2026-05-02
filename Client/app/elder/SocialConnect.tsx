import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Avatar, useTheme, Button } from "react-native-paper";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BackButton from "../components/BackButton";
import CustomCard from "../components/CustomCard";

export default function SocialConnect() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={[styles.scrollContainer, { backgroundColor: colors.background }]}>
      <BackButton />
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.primary }]}>Connect & Chat</Text>
        <Text style={[styles.subtitle, { color: (colors as any).textSecondary || "#666" }]}>
          Stay connected with your care team and AI assistant
        </Text>

        {/* AI Assistant Card */}
        <TouchableOpacity onPress={() => router.push("/elder/Chatbot")} activeOpacity={0.8}>
          <CustomCard style={[styles.aiCard, { backgroundColor: colors.surface }]}>
            <View style={styles.aiRow}>
              <View style={[styles.aiIcon, { backgroundColor: colors.primary + "20" }]}>
                <Ionicons name="chatbubble-ellipses" size={32} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.aiTitle, { color: colors.onSurface || "#333" }]}>AI Health Assistant</Text>
                <Text style={[styles.aiDescription, { color: colors.onSurfaceVariant || "#666" }]}>
                  Talk to our AI assistant about your health, medications, or just to chat.
                  Supports voice and text.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#999" />
            </View>
          </CustomCard>
        </TouchableOpacity>

        {/* Text Chat Card */}
        <TouchableOpacity
          onPress={() => router.push(`/elder/ChatScreen?id=ai&name=Health Assistant`)}
          activeOpacity={0.8}
        >
          <CustomCard style={[styles.chatCard, { backgroundColor: colors.surface }]}>
            <View style={styles.aiRow}>
              <View style={[styles.aiIcon, { backgroundColor: "#81C784" + "30" }]}>
                <Ionicons name="create" size={28} color="#4CAF50" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.aiTitle, { color: colors.onSurface || "#333" }]}>Text Chat</Text>
                <Text style={[styles.aiDescription, { color: colors.onSurfaceVariant || "#666" }]}>
                  Prefer typing? Chat with the AI assistant via text messages.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#999" />
            </View>
          </CustomCard>
        </TouchableOpacity>

        {/* Info Section */}
        <CustomCard style={[styles.infoCard, { backgroundColor: colors.surfaceVariant || "#EBF5FF" }]}>
          <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.onSurfaceVariant || "#333" }]}>
            Your caretaker can see your health data in real-time. Any medications you log,
            health records added, or meals tracked are automatically shared with them.
          </Text>
        </CustomCard>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
    marginBottom: 24,
  },
  aiCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 0,
  },
  chatCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 0,
  },
  aiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  aiIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  aiTitle: {
    fontSize: 17,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 4,
  },
  aiDescription: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    lineHeight: 18,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    lineHeight: 20,
  },
});
