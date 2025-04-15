import { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { Card, Text, TextInput, Button, useTheme, IconButton } from "react-native-paper";
import { useRouter } from "expo-router";

export default function SignupPage() {
  const { colors } = useTheme();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"elder" | "caretaker" | null>(null);

  const elderPressAnim = useRef(new Animated.Value(1)).current;
  const caretakerPressAnim = useRef(new Animated.Value(1)).current;

  const handlePress = (role: "elder" | "caretaker") => {
    setSelectedRole(role);
    const anim = role === "elder" ? elderPressAnim : caretakerPressAnim;

    Animated.sequence([
      Animated.timing(anim, { toValue: 0.93, duration: 50, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 1, duration: 50, useNativeDriver: true }),
    ]).start(() => setModalVisible(true));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.primary }]}>
        Sign Up
      </Text>

      <Text style={[styles.subtitle, { color: "black" }]}>
        Choose your role to continue
      </Text>

      <View style={styles.cardContainer}>
        <TouchableOpacity activeOpacity={1} onPress={() => handlePress("elder")}>
          <Animated.View style={[styles.animatedCard, { transform: [{ scale: elderPressAnim }] }]}>
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <Image source={require("../../assets/images/elder-icon.png")} style={styles.image} />
                <Text style={[styles.cardText, { color: colors.primary }]}>Elder</Text>
              </Card.Content>
            </Card>
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={1} onPress={() => handlePress("caretaker")}>
          <Animated.View style={[styles.animatedCard, { transform: [{ scale: caretakerPressAnim }] }]}>
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <Image source={require("../../assets/images/caretaker-icon.png")} style={styles.image} />
                <Text style={[styles.cardText, { color: colors.primary }]}>Caretaker</Text>
              </Card.Content>
            </Card>
          </Animated.View>
        </TouchableOpacity>
      </View>

      <View style={styles.registerContainer}>
        <Text style={[styles.registerText, { color: colors.text }]}>
          Already registered?{" "}
        </Text>
        <TouchableOpacity onPress={() => router.push("/auth/login")}>
          <Text style={[styles.registerLink, { color: colors.primary }]}>Click here</Text>
        </TouchableOpacity>
        <Text style={[styles.registerText, { color: colors.text }]}> to login</Text>
      </View>

      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <IconButton icon="close" size={28} iconColor={colors.primary} style={styles.closeButton} onPress={() => setModalVisible(false)} />
            <Text style={[styles.modalTitle, { color: colors.primary }]}>
              {selectedRole === "elder" ? "Elder Signup" : "Caretaker Signup"}
            </Text>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              <View style={styles.inputContainer}>
                <TextInput label="Full Name" mode="outlined" style={styles.input} theme={{ colors: { primary: colors.primary } }} />
                <TextInput label="Email" mode="outlined" keyboardType="email-address" style={styles.input} theme={{ colors: { primary: colors.primary } }} />
                <TextInput label="Password" mode="outlined" secureTextEntry style={styles.input} theme={{ colors: { primary: colors.primary } }} />
                <TextInput label="Confirm Password" mode="outlined" secureTextEntry style={styles.input} theme={{ colors: { primary: colors.primary } }} />
              </View>
              <Button mode="contained" onPress={() => setModalVisible(false)} style={styles.button}>
                Register
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  title: {
    fontSize: 32,
    fontFamily: "Poppins_700Bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
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
    flexWrap: "wrap",
  },
  registerText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 0.5 },
    textShadowRadius: 2,
  },
  registerLink: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    textDecorationLine: "underline",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    padding: 20,
    borderRadius: 15,
    elevation: 10,
    alignItems: "center",
  },
  closeButton: {  
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    marginBottom: 10,
  },
  input: {
    width: "100%",
    marginBottom: 15,
  },
  button: {
    width: "100%",
    marginTop: 10,
  },
  scrollView: {
    width: "100%",
  },
  scrollContent: {
    alignItems: "center",
  },
  inputContainer: {
    width: "100%",
  },
});
