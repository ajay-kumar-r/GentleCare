import { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  SafeAreaView
} from "react-native";
import { Text, TextInput, Button, useTheme, IconButton } from "react-native-paper";
import { useRouter } from "expo-router";
import CustomCard from "../components/CustomCard";
import BackButton from "../components/BackButton";
import { authAPI } from "../../services/api";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function SignupPage() {
  const { colors } = useTheme();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"elder" | "caretaker" | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const elderPressAnim = useRef(new Animated.Value(1)).current;
  const caretakerPressAnim = useRef(new Animated.Value(1)).current;

  const handlePress = (role: "elder" | "caretaker") => {
    setSelectedRole(role);
    const anim = role === "elder" ? elderPressAnim : caretakerPressAnim;

    Animated.sequence([
      Animated.timing(anim, { toValue: 0.93, duration: 50, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 1, duration: 50, useNativeDriver: true }),
    ]).start(() => {
      resetForm();
      setModalVisible(true);
    });
  };

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleRegister = async () => {
    // Validation
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.signup({
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
        user_type: selectedRole!,
      });

      setModalVisible(false);
      resetForm();

      // Navigate to appropriate dashboard
      if (selectedRole === "elder") {
        router.replace("/elder/Dashboard");
      } else {
        router.replace("/caretaker/Dashboard");
      }
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message || "Could not create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <BackButton />
        <Text style={[styles.title, { color: colors.primary }]}>Sign Up</Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant || "#666" }]}>
          Choose your role to get started
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.roleButton, { backgroundColor: colors.surface, borderColor: colors.border || '#E2E8F0', borderWidth: 1 }]}
          onPress={() => handlePress("elder")}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <MaterialCommunityIcons name="face-man-profile" size={32} color={colors.primary} />
          </View>
          <View style={styles.buttonTextContainer}>
            <Text style={[styles.buttonTitle, { color: colors.onSurface || "#1A1D21" }]}>Elder</Text>
            <Text style={[styles.buttonDescription, { color: colors.onSurfaceVariant || "#666" }]}>Create a health profile</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.onSurfaceVariant || "#666"} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.roleButton, { backgroundColor: colors.surface, borderColor: colors.border || '#E2E8F0', borderWidth: 1 }]}
          onPress={() => handlePress("caretaker")}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <MaterialCommunityIcons name="account-heart" size={32} color={colors.primary} />
          </View>
          <View style={styles.buttonTextContainer}>
            <Text style={[styles.buttonTitle, { color: colors.onSurface || "#1A1D21" }]}>Caretaker</Text>
            <Text style={[styles.buttonDescription, { color: colors.onSurfaceVariant || "#666" }]}>Create an admin account</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.onSurfaceVariant || "#666"} />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.onSurfaceVariant || "#666" }]}>
          Already registered?{" "}
        </Text>
        <TouchableOpacity onPress={() => router.push("/auth/login")}>
          <Text style={[styles.footerLink, { color: colors.primary }]}>
            Log in
          </Text>
        </TouchableOpacity>
      </View>

      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => !loading && setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background || "#FFF" }]}>
            <IconButton icon="close" size={28} iconColor={colors.primary} style={styles.closeButton} onPress={() => !loading && setModalVisible(false)} />
            <Text style={[styles.modalTitle, { color: colors.primary }]}>
              {selectedRole === "elder" ? "Elder Signup" : "Caretaker Signup"}
            </Text>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
              <View style={styles.inputContainer}>
                <TextInput
                  label="Full Name"
                  mode="outlined"
                  value={fullName}
                  onChangeText={setFullName}
                  style={styles.input}
                  theme={{ colors: { primary: colors.primary } }}
                  disabled={loading}
                />
                <TextInput
                  label="Email"
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  theme={{ colors: { primary: colors.primary } }}
                  disabled={loading}
                />
                <TextInput
                  label="Password"
                  mode="outlined"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                  theme={{ colors: { primary: colors.primary } }}
                  disabled={loading}
                />
                <TextInput
                  label="Confirm Password"
                  mode="outlined"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={styles.input}
                  theme={{ colors: { primary: colors.primary } }}
                  disabled={loading}
                />
              </View>
              <Button
                mode="contained"
                onPress={handleRegister}
                style={styles.button}
                disabled={loading}
                loading={loading}
              >
                {loading ? "Creating Account..." : "Register"}
              </Button>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const { height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: height * 0.08,
    paddingHorizontal: 24,
    marginBottom: 40,
    alignItems: 'center'
  },
  title: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    marginBottom: 8,
    marginTop: 20,
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
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    padding: 24,
    borderRadius: 24,
    elevation: 10,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  button: {
    width: "100%",
    marginTop: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scrollView: {
    width: "100%",
  },
  scrollContent: {
    alignItems: "center",
  },
  inputContainer: {
    width: "100%",
  },
});
