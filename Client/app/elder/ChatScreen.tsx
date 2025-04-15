import { View, StyleSheet, FlatList, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { Text, IconButton, useTheme, Avatar } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";

export default function ChatScreen() {
  const { name } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();

  const [messages, setMessages] = useState([
    { id: 1, sender: "peer", text: "Hi! How are you today?" },
    { id: 2, sender: "me", text: "I'm doing well, thank you!" },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() === "") return;
    const newMessage = { id: Date.now(), sender: "me", text: input };
    setMessages([...messages, newMessage]);
    setInput("");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
      keyboardVerticalOffset={80}
    >
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <IconButton icon="arrow-left" iconColor="white" onPress={() => router.back()} />
        <Avatar.Text size={36} label={name?.charAt(0) || "U"} style={styles.avatar} />
        <Text style={styles.name}>{name}</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messageContainer}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.sender === "me" ? styles.myMessage : styles.peerMessage,
            ]}
          >
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          value={input}
          onChangeText={setInput}
        />
        <IconButton icon="send" onPress={handleSend} iconColor={colors.primary} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    paddingTop: 40,
    elevation: 3,
  },
  avatar: {
    marginLeft: 5,
    marginRight: 10,
    backgroundColor: "#fff",
  },
  name: {
    color: "white",
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
  messageContainer: {
    padding: 10,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: "75%",
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#DCF8C6",
  },
  peerMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#EEE",
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#DDD",
    alignItems: "center",
    backgroundColor: "white",
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    fontSize: 16,
    marginRight: 5,
  },
});
