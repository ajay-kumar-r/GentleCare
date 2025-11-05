import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator
} from "react-native";
import { Text, IconButton, useTheme, Avatar } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Audio } from "expo-audio";
import * as FileSystem from "expo-file-system";
import BackButton from "../components/BackButton";

// Use the local Flask server when running locally. If you need to reach
// the server from a device on the same LAN, change this to your machine's
// LAN IP (for example: "http://192.168.1.65:5000").
const API_URL = "http://127.0.0.1:5000";

export default function ChatScreen() {
  const { name } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const soundObject = useRef(new Audio.Sound()).current;

  const [messages, setMessages] = useState([
    { id: 1, sender: "peer", text: "Hi! How are you today?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const flatListRef = useRef(null);

  useEffect(() => {
    return () => {
      if (soundObject) {
        soundObject.unloadAsync();
      }
    };
  }, []);

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === "") return;
    
    // Add user message to UI
    const userMessage = { id: Date.now(), sender: "me", text: input };
    setMessages(prev => [...prev, userMessage]);
    
    const userInput = input;
    setInput("");
    setIsLoading(true);
    
    try {
      // Get chatbot response
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userInput }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add bot response to UI
      const botMessage = { id: Date.now() + 1, sender: "peer", text: data.response };
      setMessages(prev => [...prev, botMessage]);
      
      // Get audio for the response
      await speakResponse(data.response);
      
    } catch (error) {
      console.error("Error getting response:", error);
      const errorMessage = { 
        id: Date.now() + 1, 
        sender: "peer", 
        text: "Sorry, I couldn't process your request. Please try again." 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const speakResponse = async (text) => {
    try {
      // Get speech audio from API
      const response = await fetch(`${API_URL}/speak`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Get audio blob and write to file
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onload = async () => {
        const base64data = reader.result.split(',')[1];
        const audioPath = `${FileSystem.documentDirectory}response.wav`;
        
        await FileSystem.writeAsStringAsync(audioPath, base64data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Play the audio
        await soundObject.loadAsync({ uri: audioPath });
        await soundObject.playAsync();
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Speech synthesis error:", error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
      keyboardVerticalOffset={80}
    >
      <BackButton />
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Avatar.Text size={36} label={name?.charAt(0) || "U"} style={styles.avatar} />
        <Text style={styles.name}>{name}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messageContainer}
        onLayout={scrollToBottom}
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

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Thinking...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
        />
        <IconButton 
          icon="send" 
          onPress={handleSend} 
          iconColor={colors.primary}
          disabled={input.trim() === "" || isLoading}
        />
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
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
    padding: 12,
    marginVertical: 5,
    borderRadius: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
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
    maxHeight: 120,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  loadingText: {
    marginLeft: 8,
    color: "#666",
    fontSize: 14,
  }
});