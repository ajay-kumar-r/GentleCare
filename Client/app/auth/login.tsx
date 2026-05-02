import { View, StyleSheet, TouchableOpacity, Image, Dimensions, SafeAreaView } from "react-native";
import { Text, useTheme, Button } from "react-native-paper";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function LoginPage() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Image source={require("../../assets/images/caring-hands.png")} style={styles.logo} />
        <Text style={[styles.title, { color: colors.primary }]}>GentleCare</Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant || "#666" }]}>
          Please select your role to continue
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.roleButton, { backgroundColor: colors.surface, borderColor: colors.border || '#E2E8F0', borderWidth: 1 }]}
          onPress={() => router.push("/auth/elderLogin")}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <MaterialCommunityIcons name="face-man-profile" size={32} color={colors.primary} />
          </View>
          <View style={styles.buttonTextContainer}>
            <Text style={[styles.buttonTitle, { color: colors.onSurface || "#1A1D21" }]}>Elder</Text>
            <Text style={[styles.buttonDescription, { color: colors.onSurfaceVariant || "#666" }]}>Login to manage your health</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.onSurfaceVariant || "#666"} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.roleButton, { backgroundColor: colors.surface, borderColor: colors.border || '#E2E8F0', borderWidth: 1 }]}
          onPress={() => router.push("/auth/caretakerLogin")}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <MaterialCommunityIcons name="account-heart" size={32} color={colors.primary} />
          </View>
          <View style={styles.buttonTextContainer}>
            <Text style={[styles.buttonTitle, { color: colors.onSurface || "#1A1D21" }]}>Caretaker</Text>
            <Text style={[styles.buttonDescription, { color: colors.onSurfaceVariant || "#666" }]}>Login to monitor your patients</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.onSurfaceVariant || "#666"} />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.onSurfaceVariant || "#666" }]}>
          Don't have an account?{" "}
        </Text>
        <TouchableOpacity onPress={() => router.push("/auth/signup")}>
          <Text style={[styles.footerLink, { color: colors.primary }]}>
            Sign up
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const { height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: height * 0.1,
    paddingHorizontal: 24,
    marginBottom: 40,
    alignItems: 'center'
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: "contain",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
  buttonContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 2,
  },
  buttonDescription: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: height * 0.05,
  },
  footerText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
  },
  footerLink: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
});
