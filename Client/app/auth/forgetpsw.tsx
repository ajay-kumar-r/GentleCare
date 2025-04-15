import React, { useState } from "react";
import { View, TextInput, Button, Text, TouchableOpacity, Dimensions } from "react-native";
import { useTheme } from "react-native-paper";
import { useRouter } from "expo-router";

const { height } = Dimensions.get("window");

const ForgotPasswordPage = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handleResetPassword = () => {
    console.log("Password reset requested for", email);
    router.push("/auth/login");
  };

  return (
    <View style={{ flex: 1, paddingTop: height * 0.08, paddingHorizontal: 20, alignItems: "center", backgroundColor: colors.background }}>
      <Text style={{ fontSize: 32, fontFamily: "Poppins_700Bold", marginBottom: 5, color: colors.primary }}>
        Reset Password
      </Text>
      <Text style={{ fontSize: 16, fontFamily: "Poppins_400Regular", marginBottom: 30, color: colors.text, textShadowColor: "rgba(0, 0, 0, 0.5)",textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2, }}>
        Enter your email to reset your password
      </Text>

      <View style={{ width: "100%" }}>
        <TextInput
          label="Email"
          mode="outlined"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={{
            width: "100%",
            marginBottom: 15,
            height: 50,
            paddingHorizontal: 10,
            borderRadius: 10,
            backgroundColor: colors.surface,
            borderColor: colors.primary, 
            borderWidth: 1, 
          }}
          theme={{
            colors: {
              primary: colors.primary,
              background: colors.surface,
              placeholder: colors.text,
              text: colors.text,
              underlineColor: "transparent", 
            },
          }}
        />
      </View>

      <Button 
        title="Reset Password"
        onPress={handleResetPassword}
        color={colors.primary}
        style={{
          width: "100%",
          marginTop: 20,
          borderRadius: 10,
          paddingVertical: 12,
          backgroundColor: colors.primary,
        }}
      />

      <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 20 }}>
        <Text style={{ fontSize: 16, fontFamily: "Poppins_400Regular", color: colors.text, textShadowColor: "rgba(0, 0, 0, 0.5)", textShadowOffset: { width: 1, height: 1 },textShadowRadius: 2, }}>
          Remember your password?{" "}
        </Text>
        <TouchableOpacity onPress={() => router.push("/auth/login")}>
          <Text style={{ fontSize: 16, fontFamily: "Poppins_700Bold", color: colors.primary, textDecorationLine: "underline" }}>
            Log in
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ForgotPasswordPage;
