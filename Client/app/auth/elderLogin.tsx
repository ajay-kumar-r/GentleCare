import { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, TextInput, Button, useTheme } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function ElderLoginPage() {
  const { colors } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <LinearGradient
      colors={["#4A90E2", "#F5A623"]} // Subtly lighter blue-to-orange gradient
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Logo */}
        <Image
          source={require("../../assets/images/elder-icon.png")}
          style={styles.logo}
        />

        {/* Title */}
        <Text style={[styles.title, { color: colors.primary }]}>
          Elder Login
        </Text>

        {/* Input Fields */}
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

        {/* Login Button */}
        <Button
          mode="contained"
          onPress={() => router.push("/dashboard/elder")}
          style={styles.button}
        >
          Login
        </Button>

        {/* Forgot Password */}
        <TouchableOpacity>
          <Text style={[styles.link, { color: colors.primary }]}>
            Forgot Password?
          </Text>
        </TouchableOpacity>

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={[styles.registerText, { color: colors.text }]}>
            New User?
          </Text>
          <TouchableOpacity onPress={() => router.push("/auth/signup")}>
            <Text style={[styles.registerLink, { color: colors.primary }]}>
              Register Here
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontFamily: "Poppins_700Bold",
    marginBottom: 30,
    textTransform: "uppercase",
    letterSpacing: 1.5,
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
    fontSize: 18, // Increased font size
    fontFamily: "Poppins_600SemiBold",
    textDecorationLine: "underline",
    textShadowColor: "rgba(0, 0, 0, 0.3)", // Added shadow
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  registerContainer: {
    flexDirection: "row",
    marginTop: 20,
  },
  registerText: {
    fontSize: 18, // Increased font size
    fontFamily: "Poppins_400Regular",
    textShadowColor: "rgba(0, 0, 0, 0.3)", // Added shadow
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  registerLink: {
    fontSize: 18, // Increased font size
    fontFamily: "Poppins_600SemiBold",
    textDecorationLine: "underline",
    marginLeft: 5,
    textShadowColor: "rgba(0, 0, 0, 0.3)", // Added shadow
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
