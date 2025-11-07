import { View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Text, TextInput, Button, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import { useState } from "react";
import BackButton from "../components/BackButton";
import { authAPI } from "../../services/api";

export default function CaretakerLogin() {
  const { colors } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.login(email, password);
      
      // Validate user type
      if (response.user.user_type !== 'caretaker') {
        Alert.alert("Error", "This account is not a caretaker account. Please use the Elder login.");
        await authAPI.logout();
        return;
      }

      // Navigate to caretaker dashboard
      router.replace("/caretaker/Dashboard");
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={[styles.title, { color: colors.primary }]}>Caretaker Login</Text>

      <View style={styles.inputContainer}>
        <TextInput
          label="Email"
          mode="outlined"
          keyboardType="email-address"
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
      </View>

      <TouchableOpacity onPress={() => router.push("/auth/forgetpsw")}>
        <Text style={styles.forgotPassword}>Forgot Password?</Text>
      </TouchableOpacity>

      <Button
        mode="contained"
        onPress={handleLogin}
        style={styles.button}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : "Login"}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 36,
    fontFamily: "Poppins_700Bold",
    marginBottom: 30,
    textTransform: "uppercase",
    letterSpacing: 2,
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    maxWidth: 400,
  },
  input: {
    width: "100%",
    marginBottom: 15,
  },
  forgotPassword: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    textDecorationLine: "underline",
    marginBottom: 20,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  button: {
    width: "100%",
    maxWidth: 400,
    marginTop: 10,
    borderRadius: 5,
  },
});
