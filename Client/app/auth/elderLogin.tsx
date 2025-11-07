import { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Text, TextInput, Button, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import BackButton from "../components/BackButton";
import { authAPI } from "../../services/api";

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

      // Navigate to elder dashboard
      router.replace('/elder/Dashboard');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.innerContainer}
      >
        <Text style={[styles.title, { color: colors.primary }]}>Elder Login</Text>

        <View style={styles.cardContainer}>
          <Image
            source={require("../../assets/images/elder-icon.png")}
            style={styles.logo}
          />
        </View>

        <TextInput
          label="Email"
          mode="outlined"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          theme={{ colors: { primary: colors.primary } }}
        />
        <TextInput
          label="Password"
          mode="outlined"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          theme={{ colors: { primary: colors.primary } }}
        />
        <Button
          mode="contained"
          onPress={handleLogin}
          style={styles.button}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : 'Login'}
        </Button>
        <TouchableOpacity onPress={() => router.push("/auth/forgetpsw")}>
          <Text style={[styles.link, { color: colors.primary, textAlign: "center" }]}>
            Forgot Password?
          </Text>
        </TouchableOpacity>

        <View style={styles.registerContainer}>
          <Text style={[styles.registerText, { color: colors.text }]}>
            New User?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.push("/auth/signup")}>
            <Text style={[styles.registerLink, { color: colors.primary }]}>
              Register Here
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  innerContainer: {
    width: "80%",
    paddingHorizontal: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    alignSelf: "center",
  },
  title: {
    fontSize: 36,
    fontFamily: "Poppins_700Bold",
    marginBottom: 30,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    textAlign: "center",
  },
  input: {
    width: "100%",
    marginBottom: 15,
  },
  button: {
    width: "100%",
    paddingVertical: 5,
    borderRadius: 5,
  },
  link: {
    marginTop: 10,
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    textDecorationLine: "underline",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  registerContainer: {
    flexDirection: "row",
    marginTop: 20,
    justifyContent: "center",
  },
  registerText: {
    fontSize: 18,
    fontFamily: "Poppins_400Regular",
    textShadowColor: "rgba(0, 0, 0, 0.9)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  registerLink: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    textDecorationLine: "underline",
    marginLeft: 5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cardContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
});
