import { View, StyleSheet, TouchableOpacity, Image, Animated } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";

export default function LoginPage() {
  const { colors } = useTheme();
  const router = useRouter();

  const fadeAnimCards = useRef(new Animated.Value(0)).current;
  const slideAnimCards = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnimCards, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimCards, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.background }]}>Login</Text>

        <Animated.View
          style={[
            styles.cardContainer,
            {
              opacity: fadeAnimCards,
              transform: [{ translateY: slideAnimCards }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.cardWrapper}
            onPress={() => router.push("/elderLogin")}
          >
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <Image
                  source={require("../../assets/images/elder-icon.png")}
                  style={styles.image}
                />
                <Text
                  style={[
                    styles.cardText,
                    { color: colors.primary, textShadowColor: "rgba(0, 0, 0, 0.5)", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
                  ]}
                >
                  Elder
                </Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cardWrapper}
            onPress={() => router.push("/caretakerLogin")}
          >
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <Image
                  source={require("../../assets/images/caretaker-icon.png")}
                  style={styles.image}
                />
                <Text
                  style={[
                    styles.cardText,
                    { color: colors.primary, textShadowColor: "rgba(0, 0, 0, 0.5)", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
                  ]}
                >
                  Caretaker
                </Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.registerContainer}>
          <Text
            style={[
              styles.registerText,
              {
                color: colors.text,
                fontWeight: "bold",
                textShadowColor: "rgba(0, 0, 0, 0.5)",
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 2,
              },
            ]}
          >
            New User?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text
              style={[
                styles.registerLink,
                {
                  color: colors.secondary,
                  fontWeight: "bold",
                  textShadowColor: "rgba(0, 0, 0, 0.5)",
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 2,
                },
              ]}
            >
              Register Here
            </Text>
          </TouchableOpacity>
        </View>
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
  },
  cardContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  cardWrapper: {
    flex: 1,
    maxWidth: 170,
  },
  card: {
    borderRadius: 15,
    elevation: 5,
    backgroundColor: "white",
  },
  cardContent: {
    alignItems: "center",
    paddingVertical: 30,
  },
  image: {
    width: 70,
    height: 70,
    marginBottom: 15,
  },
  cardText: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    textTransform: "capitalize",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  registerText: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
  },
  registerLink: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    textDecorationLine: "underline",
  },
});
