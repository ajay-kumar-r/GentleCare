import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, TextInput, Button, useTheme } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function CaretakerLogin() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.gradient}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.background }]}>Caretaker Login</Text>

        <View style={styles.inputContainer}>
          <TextInput
            label="Email"
            mode="outlined"
            keyboardType="email-address"
            style={styles.input}
            theme={{ colors: { primary: colors.primary } }}
          />
          <TextInput
            label="Password"
            mode="outlined"
            secureTextEntry
            style={styles.input}
            theme={{ colors: { primary: colors.primary } }}
          />
        </View>

        {/* Forgot Password */}
        <TouchableOpacity>
          <Text style={styles.forgotPassword}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <Button mode="contained" onPress={() => router.push("/caretakerDashboard")} style={styles.button}>
          Login
        </Button>
      </View>
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
  title: {
    fontSize: 36,
    fontFamily: "Poppins_700Bold",
    marginBottom: 30,
    textTransform: "uppercase",
    letterSpacing: 2,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
    color: "white",
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
  },
});
