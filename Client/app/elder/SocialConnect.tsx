import { useState } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Avatar, useTheme, Button } from "react-native-paper";
import { useRouter } from "expo-router";

const initialPeers = [
  { id: 1, name: "Alice Johnson", avatar: "https://i.pravatar.cc/150?img=1", online: true },
  { id: 2, name: "Robert Smith", avatar: "https://i.pravatar.cc/150?img=2", online: false },
  { id: 3, name: "Maria Garcia", avatar: "https://i.pravatar.cc/150?img=3", online: true },
];

const suggestedPeople = [
  { id: 4, name: "David Brown", avatar: "https://i.pravatar.cc/150?img=4" },
  { id: 5, name: "Sophia Miller", avatar: "https://i.pravatar.cc/150?img=5" },
  { id: 6, name: "James Wilson", avatar: "https://i.pravatar.cc/150?img=6" },
];

export default function SocialConnect() {
  const { colors } = useTheme();
  const router = useRouter();
  const [peers, setPeers] = useState(initialPeers);
  const [suggested, setSuggested] = useState(suggestedPeople);

  const handleAddPerson = (person) => {
    setPeers([...peers, { ...person, online: Math.random() > 0.5 }]);
    setSuggested(suggested.filter((p) => p.id !== person.id));
  };

  const handleRemoveSuggestion = (id) => {
    setSuggested(suggested.filter((p) => p.id !== id));
  };

  const handleRemoveFriend = (id) => {
    setPeers(peers.filter((peer) => peer.id !== id));
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.primary }]}>Social Connect</Text>

        {peers.map((peer) => (
          <View key={peer.id} style={styles.peerItem}>
            <TouchableOpacity
              style={styles.peerInfoContainer}
              onPress={() => router.push(`/elder/ChatScreen?id=${peer.id}&name=${peer.name}`)}
            >
              <Avatar.Image size={48} source={{ uri: peer.avatar }} />
              <View style={styles.peerInfo}>
                <Text style={styles.peerName}>{peer.name}</Text>
                <Text style={peer.online ? styles.online : styles.offline}>
                  {peer.online ? "🟢 Online" : "🔴 Offline"}
                </Text>
              </View>
            </TouchableOpacity>
            <Button mode="outlined" compact style={styles.removeFriendButton} onPress={() => handleRemoveFriend(peer.id)}>
              Remove
            </Button>
          </View>
        ))}

        {suggested.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>People You May Know</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestedRow}>
              {suggested.map((person) => (
                <View key={person.id} style={styles.suggestedCard}>
                  <Avatar.Image size={60} source={{ uri: person.avatar }} />
                  <Text style={styles.suggestedName}>{person.name}</Text>
                  <View style={styles.buttonGroup}>
                    <Button mode="contained" compact style={styles.addButton} onPress={() => handleAddPerson(person)}>
                      Add
                    </Button>
                    <Button mode="outlined" compact style={styles.removeButton} onPress={() => handleRemoveSuggestion(person.id)}>
                      Remove
                    </Button>
                  </View>
                </View>
              ))}
            </ScrollView>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#F5F5F5",
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    marginTop: 20,
    marginBottom: 10,
  },
  peerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 30,
    marginBottom: 10,
    elevation: 2,
  },
  peerInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  peerInfo: {
    marginLeft: 15,
  },
  peerName: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
  },
  online: {
    color: "green",
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
  offline: {
    color: "red",
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
  removeFriendButton: {
    borderColor: "red",
  },
  suggestedRow: {
    flexDirection: "row",
    gap: 15,
    paddingVertical: 10,
  },
  suggestedCard: {
    width: 200,
    height: 200,
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    elevation: 3,
  },
  suggestedName: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
    marginVertical: 5,
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
  addButton: {
    flex: 1,
    borderRadius: 5,
  },
  removeButton: {
    flex: 1,
    borderRadius: 5,
    borderColor: "red",
  },
});

