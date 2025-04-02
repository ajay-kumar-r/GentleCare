import { View, StyleSheet, TouchableOpacity, Image, Animated } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";

export default function LoginPage() {
  const { colors } = useTheme();
  const router = useRouter();

  const elderPressAnim = useRef(new Animated.Value(1)).current;
  const caretakerPressAnim = useRef(new Animated.Value(1)).current;

  const handlePress = (role: "elder" | "caretaker") => {
    const anim = role === "elder" ? elderPressAnim : caretakerPressAnim;

    Animated.sequence([
      Animated.timing(anim, { toValue: 0.93, duration: 50, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 1, duration: 50, useNativeDriver: true }),
    ]).start(() => {
      if (role === "elder") {
        router.push("/elderLogin");
      } else {
        router.push("/caretakerLogin");
      }
    });
  };

  return (
    <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.gradient}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.background }]}>Login</Text>

        <View style={styles.cardContainer}>
          <TouchableOpacity activeOpacity={1} onPress={() => handlePress("elder")}>
            <Animated.View style={[styles.animatedCard, { transform: [{ scale: elderPressAnim }] }]}>
              <Card style={styles.card}>
                <Card.Content style={styles.cardContent}>
                  <Image source={require("../../assets/images/elder-icon.png")} style={styles.image} />
                  <Text
                    style={[
                      styles.cardText,
                      {
                        color: colors.primary,
                        textShadowColor: "rgba(0, 0, 0, 0.3)",
                        textShadowOffset: { width: 1, height: 1 },
                        textShadowRadius: 2,
                      },
                    ]}
                  >
                    Elder
                  </Text>
                </Card.Content>
              </Card>
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={1} onPress={() => handlePress("caretaker")}>
            <Animated.View style={[styles.animatedCard, { transform: [{ scale: caretakerPressAnim }] }]}>
              <Card style={styles.card}>
                <Card.Content style={styles.cardContent}>
                  <Image source={require("../../assets/images/caretaker-icon.png")} style={styles.image} />
                  <Text
                    style={[
                      styles.cardText,
                      {
                        color: colors.primary,
                        textShadowColor: "rgba(0, 0, 0, 0.3)",
                        textShadowOffset: { width: 1, height: 1 },
                        textShadowRadius: 2,
                      },
                    ]}
                  >
                    Caretaker
                  </Text>
                </Card.Content>
              </Card>
            </Animated.View>
          </TouchableOpacity>
        </View>

        <View style={styles.registerContainer}>
          <Text
            style={[
              styles.registerText,
              {
                color: colors.text,
                fontWeight: "bold",
                textShadowColor: "rgba(0, 0, 0, 0.3)",
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 2,
              },
            ]}
          >
            New User?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.push("/auth/signup")}>
            <Text
              style={[
                styles.registerLink,
                {
                  color: colors.secondary,
                  fontWeight: "bold",
                  textShadowColor: "rgba(0, 0, 0, 0.3)",
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
  animatedCard: {
    width: 150,
  },
  card: {
    width: 150,
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
