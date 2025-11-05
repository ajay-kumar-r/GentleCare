import { View, StyleSheet, TouchableOpacity, Image, Animated, Dimensions } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import { useRef } from "react";

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
        router.push("/auth/elderLogin");
      } else {
        router.push("/auth/caretakerLogin");
      }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Image source={require("../../assets/images/caring-hands.png")} style={styles.logo} />

      <Text style={[styles.title, { color: colors.primary }]}>Welcome</Text>
      <Text style={[styles.subtitle, { color: "black" }]}>
        Choose your role to continue
      </Text>

      <View style={styles.cardContainer}>
        <TouchableOpacity activeOpacity={1} onPress={() => handlePress("elder")}>
          <Animated.View style={[styles.animatedCard, { transform: [{ scale: elderPressAnim }] }]}>
            <View style={styles.card}>
              <View style={styles.cardContent}>
                <Image source={require("../../assets/images/elder-icon.png")} style={styles.image} />
                <Text style={[styles.cardText, { color: colors.primary }]}>Elder</Text>
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={1} onPress={() => handlePress("caretaker")}>
          <Animated.View style={[styles.animatedCard, { transform: [{ scale: caretakerPressAnim }] }]}>
            <View style={styles.card}>
              <View style={styles.cardContent}>
                <Image source={require("../../assets/images/caretaker-icon.png")} style={styles.image} />
                <Text style={[styles.cardText, { color: colors.primary }]}>Caretaker</Text>
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </View>

      <View style={styles.registerContainer}>
  <Text style={[styles.registerText, { color: (colors as any).onBackground || colors.primary }]}> 
          New User?{" "}
        </Text>
        <TouchableOpacity onPress={() => router.push("/auth/signup")}>
          <Text style={[styles.registerLink, { color: colors.primary }]}>
            Register Here
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const { height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: height * 0.08,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  logo: {
    width: 90,
    height: 90,
    resizeMode: "contain",
    marginBottom: 15,
  },
  title: {
    fontSize: 32,
    fontFamily: "Poppins_700Bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: "Poppins_400Regular",
    marginBottom: 35,
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
    elevation: 4,
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
    fontFamily: "Poppins_700Bold",
    textTransform: "capitalize",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 40,
  },
  registerText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  registerLink: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    textDecorationLine: "underline",
  },
});
