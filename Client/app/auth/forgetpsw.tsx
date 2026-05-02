import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, TextInput, Button, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import BackButton from "../components/BackButton";

const { height } = Dimensions.get("window");

const ForgotPasswordPage = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleResetPassword = () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }
    // In production, this would call a backend endpoint
    // For now, show a confirmation message
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <BackButton />
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✉️</Text>
          <Text style={[styles.successTitle, { color: colors.primary }]}>Check Your Email</Text>
          <Text style={[styles.successBody, { color: (colors as any).textSecondary || "#666" }]}>
            If an account exists for {email}, you'll receive a password reset link shortly.
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push("/auth/login")}
            style={styles.button}
            buttonColor={colors.primary}
          >
            Back to Login
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BackButton />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.innerContainer}
      >
        <Text style={[styles.title, { color: colors.primary }]}>Reset Password</Text>
        <Text style={[styles.subtitle, { color: (colors as any).textSecondary || "#666" }]}>
          Enter your email to reset your password
        </Text>

        <TextInput
          label="Email"
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          theme={{ colors: { primary: colors.primary } }}
        />

        <Button
          mode="contained"
          onPress={handleResetPassword}
          style={styles.button}
          buttonColor={colors.primary}
        >
          Reset Password
        </Button>

        <View style={styles.loginRow}>
          <Text style={[styles.loginText, { color: (colors as any).text || "#333" }]}>
            Remember your password?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.push("/auth/login")}>
            <Text style={[styles.loginLink, { color: colors.primary }]}>Log in</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: height * 0.08,
    paddingHorizontal: 20,
  },
  innerContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontFamily: "Poppins_700Bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    width: "100%",
    marginBottom: 20,
  },
  button: {
    width: "100%",
    borderRadius: 8,
    paddingVertical: 4,
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  loginText: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
  },
  loginLink: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    textDecorationLine: "underline",
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    marginBottom: 12,
  },
  successBody: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
});

export default ForgotPasswordPage;
