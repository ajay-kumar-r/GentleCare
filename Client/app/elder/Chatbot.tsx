import React, { useState, useRef } from "react";
import { View, StyleSheet, Animated, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { IconButton, useTheme } from "react-native-paper";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";

export default function ChatbotVoice() {
  const { colors } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [chatbotResponse, setChatbotResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const waveforms = useRef(Array(5).fill(null).map(() => new Animated.Value(1))).current;

  const animateWaveform = () => {
    waveforms.forEach((waveform, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveform, {
            toValue: 1.5 + Math.random(),
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(waveform, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
        ])
      ).start();
    });
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        alert("Microphone permission is required!");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      setChatbotResponse("");
      animateWaveform();
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setLoading(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      const formData = new FormData();
      formData.append("file", {
        uri,
        type: "audio/wav",
        name: "recording.wav",
      });

      const transcribeRes = await fetch("<ngrok link>/transcribe", {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const transcribeData = await transcribeRes.json();
      const userMessage = transcribeData.transcription;

      const chatRes = await fetch("<ngrok link>/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const chatData = await chatRes.json();
      const botReply = chatData.response;

      setChatbotResponse(botReply);

      const speakRes = await fetch("<ngrok link>/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: botReply }),
      });

      const audioBlob = await speakRes.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64data = reader.result.split(",")[1];
        const fileUri = FileSystem.documentDirectory + "bot-response.wav";

        await FileSystem.writeAsStringAsync(fileUri, base64data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: fileUri },
          { shouldPlay: true }
        );

        await sound.playAsync();
      };

      reader.readAsDataURL(audioBlob);
    } catch (err) {
      console.error("Voice interaction failed:", err);
    } finally {
      setRecording(null);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        {!isRecording ? (
          <TouchableOpacity style={styles.micContainer} onPress={startRecording} disabled={loading}>
            <IconButton icon="microphone" size={80} color={colors.primary} style={styles.micIcon} />
          </TouchableOpacity>
        ) : (
          <View style={styles.waveformContainer}>
            {waveforms.map((waveform, index) => (
              <Animated.View
                key={index}
                style={[styles.waveform, { transform: [{ scaleY: waveform }] }]}
              />
            ))}
          </View>
        )}
      </View>

      {isRecording && (
        <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
          <Text style={styles.stopButtonText}>Stop</Text>
        </TouchableOpacity>
      )}

      {loading && (
        <View style={{ marginTop: 20 }}>
          <ActivityIndicator size="small" color="#555" />
          <Text style={{ marginTop: 5 }}>Processing...</Text>
        </View>
      )}

      {chatbotResponse !== "" && (
        <View style={styles.responseContainer}>
          <Text style={styles.chatbotResponseText}>{chatbotResponse}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
    justifyContent: "center",
    alignItems: "center",
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  micContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#007AFF",
    elevation: 5,
  },
  micIcon: {
    backgroundColor: "transparent",
  },
  waveformContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "flex-end",
    width: "80%",
    height: 100,
  },
  waveform: {
    height: 5,
    backgroundColor: "#007AFF",
    borderRadius: 2,
    width: 30,
    marginHorizontal: 3,
  },
  stopButton: {
    position: "absolute",
    bottom: 50,
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  stopButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  responseContainer: {
    position: "absolute",
    bottom: 150,
    backgroundColor: "#f0f0f0",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  chatbotResponseText: {
    fontSize: 16,
    color: "#333",
  },
});
