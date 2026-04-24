import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Animated, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { IconButton, useTheme } from "react-native-paper";
import { useAudioRecorder, AudioModule } from "expo-audio";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import BackButton from "../components/BackButton";
import { API_BASE_URL } from "../../services/api";

const API_URL = API_BASE_URL;

export default function ChatbotVoice() {
  const { colors } = useTheme();
  const audioRecorder = useAudioRecorder({
    extension: ".m4a",
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    android: {
      extension: ".m4a",
      outputFormat: "mpeg4",
      audioEncoder: "aac",
      sampleRate: 44100,
    },
    ios: {
      extension: ".m4a",
      audioQuality: 0x7f,
      sampleRate: 44100,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
    web: {},
  });

  const [isRecording, setIsRecording] = useState(false);
  const [chatbotResponse, setChatbotResponse] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAiReady, setIsAiReady] = useState(true);
  const waveforms = useRef(Array(5).fill(null).map(() => new Animated.Value(1))).current;

  useEffect(() => {
    const checkCapabilities = async () => {
      try {
        const response = await fetch(`${API_URL}/capabilities`);
        if (!response.ok) return;
        const data = await response.json();
        const ai = data.ai || {};
        const ready = !!(ai.chatbot && ai.speech_to_text && ai.text_to_speech);
        setIsAiReady(ready);
        if (!ready) {
          setErrorMessage("Voice AI services are not fully configured on the server.");
        }
      } catch {
        // Keep default behavior if capability endpoint is unreachable.
      }
    };

    checkCapabilities();
  }, []);

  const animateWaveform = () => {
    waveforms.forEach((waveform) => {
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
      if (!isAiReady) {
        setErrorMessage("Voice AI services are not fully configured on the server.");
        return;
      }

      setErrorMessage("");
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        alert("Microphone permission is required!");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      await AudioModule.setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await audioRecorder.record();
      setIsRecording(true);
      setChatbotResponse("");
      animateWaveform();
    } catch (err) {
      console.error("Failed to start recording", err);
      setErrorMessage("Failed to start recording");
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setLoading(true);
    setErrorMessage("");

    try {
      await audioRecorder.stop();
      const recordingUri = audioRecorder.uri;
      if (!recordingUri) {
        throw new Error("No recording was captured. Please try again.");
      }

      const formData = new FormData();
      formData.append("file", {
        uri: recordingUri,
        name: "recording.m4a",
        type: "audio/m4a",
      } as any);

      const transcribeRes = await fetch(`${API_URL}/transcribe`, {
        method: "POST",
        body: formData,
      });
      const transcribeData = await transcribeRes.json();
      if (!transcribeRes.ok) {
        throw new Error(transcribeData.error || "Transcription failed");
      }

      const userMessage = transcribeData.transcript || transcribeData.transcription || "";
      if (!userMessage.trim()) {
        throw new Error("Transcription returned empty text");
      }

      const chatRes = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
      const chatData = await chatRes.json();
      if (!chatRes.ok) {
        throw new Error(chatData.error || "Chat request failed");
      }

      const botReply = chatData.response;
      if (!botReply) {
        throw new Error("No response generated");
      }
      setChatbotResponse(botReply);

      const speakRes = await fetch(`${API_URL}/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: botReply }),
      });
      if (!speakRes.ok) {
        const speakData = await speakRes.json().catch(() => ({}));
        throw new Error(speakData.error || "Speech generation failed");
      }

      const audioBlob = await speakRes.blob();
      const reader = new FileReader();

      reader.onload = async () => {
        const result = String(reader.result || "");
        const base64Audio = result.includes(",") ? result.split(",")[1] : result;
        const audioPath = `${FileSystem.documentDirectory}chatbot-response.wav`;

        await FileSystem.writeAsStringAsync(audioPath, base64Audio, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: audioPath },
          { shouldPlay: true }
        );

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync();
          }
        });
      };

      reader.onerror = () => {
        setErrorMessage("Unable to play voice response");
      };

      reader.readAsDataURL(audioBlob);
    } catch (err: any) {
      console.error("Voice interaction failed:", err);
      const message = err?.message || "Voice interaction failed";
      setErrorMessage(message);
      setChatbotResponse(
        message.includes("configured")
          ? "AI voice services are not configured on the server yet."
          : "I could not process voice chat right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <View style={styles.mainContent}>
        {!isRecording ? (
          <TouchableOpacity style={styles.micContainer} onPress={startRecording} disabled={loading || !isAiReady}>
            <IconButton icon="microphone" size={80} iconColor={colors.primary} style={styles.micIcon} />
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

      {errorMessage !== "" && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
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
  errorContainer: {
    position: "absolute",
    bottom: 230,
    backgroundColor: "#FDECEC",
    padding: 12,
    borderRadius: 10,
    width: "85%",
  },
  errorText: {
    color: "#B42318",
    fontSize: 14,
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
