import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { useLocalSearchParams } from "expo-router";
import { Audio } from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import BackButton from "../components/BackButton";
import { API_BASE_URL, storage } from "../../services/api";

const API_URL = API_BASE_URL;

export default function ChatScreen() {
  const { name } = useLocalSearchParams();
  const { colors } = useTheme();
  const soundRef = useRef<Audio.Sound | null>(null);
  const displayName = (name as string) || 'Health Assistant';

  const [messages, setMessages] = useState([
    { id: 1, sender: "peer", text: `Hi! I'm your AI health assistant. How can I help you today?` },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const flatListRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    if (input.trim() === "") return;
    
    // Add user message to UI
    const userMessage = { id: Date.now(), sender: "me", text: input };
    setMessages(prev => [...prev, userMessage]);
    
    const userInput = input;
    setInput("");
    setIsLoading(true);
    
    try {
      const token = await storage.getToken();
      
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
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
      const token = await storage.getToken();
      
      // Get speech audio from API
      const response = await fetch(`${API_URL}/speak`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
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
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
        } else {
          soundRef.current = new Audio.Sound();
        }
        await soundRef.current.loadAsync({ uri: audioPath });
        await soundRef.current.playAsync();
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Speech synthesis error:", error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardVerticalOffset={80}
    >
      <BackButton />
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Avatar.Icon size={36} icon="robot" style={styles.avatar} color={colors.primary} />
        <View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.headerSub}>AI Assistant</Text>
        </View>
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
              item.sender === "me" ? [styles.myMessage, { backgroundColor: colors.primaryContainer || (colors.primary + "30") }] : [styles.peerMessage, { backgroundColor: colors.surfaceVariant || "#EEE" }],
            ]}
          >
            <Text style={[styles.messageText, { color: colors.onSurface || "#1A1D21" }]}>{item.text}</Text>
          </View>
        )}
      />

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.onSurfaceVariant || "#666" }]}>Thinking...</Text>
        </View>
      )}

      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.surfaceVariant }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surfaceVariant || "#F0F0F0", color: colors.onSurface || "#1A1D21" }]}
          placeholderTextColor={colors.onSurfaceVariant || "#999"}
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    elevation: 0,
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
  headerSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
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
    elevation: 0,
  },
  myMessage: {
    alignSelf: "flex-end",
  },
  peerMessage: {
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    alignItems: "center",
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 20,
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
    fontSize: 14,
  }
});