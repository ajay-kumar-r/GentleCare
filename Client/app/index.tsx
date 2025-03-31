import { View, StyleSheet, Animated, Image } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { LinearGradient } from "expo-linear-gradient";

SplashScreen.preventAutoHideAsync();

export default function LandingPage() {
  const { colors } = useTheme();
  const router = useRouter();
  const fadeAnimImage = useRef(new Animated.Value(0)).current;
  const slideAnimImage = useRef(new Animated.Value(50)).current;
  const fadeAnimText = useRef(new Animated.Value(0)).current;
  const slideAnimText = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnimImage, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimImage, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnimText, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimText, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => SplashScreen.hideAsync());
  }, []);

  return (
    <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.gradient}>
      <View style={styles.container}>
        <Animated.Image
          source={require("../assets/images/caring-hands.png")}
          style={[
            styles.image,
            { opacity: fadeAnimImage, transform: [{ translateY: slideAnimImage }] },
          ]}
          resizeMode="contain"
        />
        <Animated.Text
          style={[
            styles.title,
            { color: colors.background, opacity: fadeAnimText, transform: [{ translateY: slideAnimText }] },
          ]}
        >
          Welcome to GentleCare
        </Animated.Text>
        <Animated.Text
          style={[
            styles.subtitle,
            { color: colors.text, opacity: fadeAnimText, transform: [{ translateY: slideAnimText }] },
          ]}
        >
          A helping hand for your loved ones.
        </Animated.Text>
        <Button
          mode="contained"
          onPress={() => router.push("/auth/login")}
          style={[styles.button, { backgroundColor: colors.background }]}
          labelStyle={{ color: colors.primary }}
        >
          Get Started
        </Button>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  image: { width: 200, height: 200, marginBottom: 20 },
  title: { fontSize: 32, fontFamily: "Poppins_700Bold", textAlign: "center", marginTop: 10 },
  subtitle: { fontSize: 18, marginTop: 10, fontFamily: "Poppins_400Regular", textAlign: "center" },
  button: { marginTop: 30, paddingHorizontal: 30, borderRadius: 25, elevation: 5 },
});
