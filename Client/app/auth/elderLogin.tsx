import { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  SafeAreaView
} from "react-native";
import { Text, TextInput, Button, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import BackButton from "../components/BackButton";
import { authAPI } from "../../services/api";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function ElderLoginPage() {
  const { colors } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.login(email, password);
      
      if (response.user.user_type !== 'elder') {
        Alert.alert('Error', 'This account is not registered as an elder');
        await authAPI.logout();
        return;
      }

      router.replace('/elder/Dashboard');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <BackButton />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
              <MaterialCommunityIcons name="face-man-profile" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.onSurface || "#1A1D21" }]}>Elder Login</Text>
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant || "#666" }]}>Welcome back. Please enter your details.</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Email"
              mode="outlined"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              autoCapitalize="none"
              theme={{ colors: { primary: colors.primary } }}
              left={<TextInput.Icon icon="email-outline" color={colors.onSurfaceVariant} />}
            />
            
            <TextInput
              label="Password"
              mode="outlined"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              theme={{ colors: { primary: colors.primary } }}
              left={<TextInput.Icon icon="lock-outline" color={colors.onSurfaceVariant} />}
            />

            <TouchableOpacity 
              onPress={() => router.push("/auth/forgetpsw")}
              style={styles.forgotPassword}
            >
              <Text style={{ color: colors.primary, fontFamily: "Poppins_500Medium" }}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <Button
              mode="contained"
              onPress={handleLogin}
              style={[styles.button, { backgroundColor: colors.primary }]}
              labelStyle={styles.buttonLabel}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : 'Log In'}
            </Button>
          </View>

          <View style={styles.footer}>
            <Text style={{ color: colors.onSurfaceVariant || "#666", fontFamily: "Poppins_400Regular" }}>
              Don't have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/auth/signup")}>
              <Text style={{ color: colors.primary, fontFamily: "Poppins_600SemiBold" }}>
                Sign up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: 'flex-start',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 6,
    elevation: 0,
  },
  buttonLabel: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
  },
});
