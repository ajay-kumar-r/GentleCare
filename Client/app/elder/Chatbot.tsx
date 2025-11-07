import React, { useState, useRef } from "react";
import { View, StyleSheet, Animated, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { IconButton, useTheme } from "react-native-paper";
import { 
  useAudioRecorder, 
  AudioModule,
  AndroidOutputFormat,
  AndroidAudioEncoder,
  AudioQuality,
  BitRateStrategy
} from "expo-audio";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import BackButton from "../components/BackButton";

// Use your Mac's local IP address so the mobile device can reach the server
import CustomCard from "../components/Caretaker/QuickAccessCard";
import CustomSnackbar from "../components/Caretaker/QuickAccessCard";
import theme from "../components/theme";

const API_URL = "http://192.168.1.65:5001";

export default function ChatbotVoice() {
  const { colors } = useTheme();
  const audioRecorder = useAudioRecorder(
    {
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
        audioQuality: 0x7F, // High quality (127)
        sampleRate: 44100,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {},
    }
  );
  const [isRecording, setIsRecording] = useState(false);
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
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        alert("Microphone permission is required!");
        return;
      }

      // Set audio mode to allow recording on iOS using both APIs
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Also set audio mode using AudioModule for expo-audio
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
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setLoading(true);

    try {
      // Get the recording URI before stopping
      const tempUri = audioRecorder.uri;
      console.log("Recording URI before stop:", tempUri);
      
      if (!tempUri) {
        throw new Error("No recording URI - recording may not have started properly");
      }

      // Read the file using FileSystem BEFORE stopping
      const base64Audio = await FileSystem.readAsStringAsync(tempUri, {
        encoding: "base64",
      });
      console.log("Recording read, size:", base64Audio.length, "chars");
      
      // Stop recording AFTER we've read the file
      await audioRecorder.stop();
      
      console.log("Recording stopped successfully");

      // Convert base64 to blob for upload
      const byteCharacters = atob(base64Audio);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "audio/m4a" });

      // Create form data for upload with the blob
      const formData = new FormData();
      formData.append("file", blob, "recording.m4a");

      const transcribeRes = await fetch(`${API_URL}/transcribe`, {
        method: "POST",
        body: formData,
        // Don't set Content-Type header - let the browser set it with boundary
      });

      const transcribeData = await transcribeRes.json();
      const userMessage = transcribeData.transcription;

      const chatRes = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const chatData = await chatRes.json();
      const botReply = chatData.response;

      setChatbotResponse(botReply);

      const speakRes = await fetch(`${API_URL}/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: botReply }),
      });

      // Get audio blob and convert to playable format
      const audioBlob = await speakRes.blob();
      
      // Create a blob URL (works on web and mobile)
      const blobUrl = URL.createObjectURL(audioBlob);
      
      // Play the audio directly from the blob URL
      const { sound } = await Audio.Sound.createAsync(
        { uri: blobUrl },
        { shouldPlay: true }
      );

      await sound.playAsync();
      
      // Clean up the blob URL after playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          URL.revokeObjectURL(blobUrl);
        }
      });
    } catch (err) {
      console.error("Voice interaction failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <View style={styles.mainContent}>
        {!isRecording ? (
          <TouchableOpacity style={styles.micContainer} onPress={startRecording} disabled={loading}>
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
