import React, { useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Modal,
  TouchableOpacity,
  Alert,
  Animated,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  IconButton,
  FAB,
  useTheme,
} from "react-native-paper";
import EmergencyContactItem from "../components/Caretaker/EmergencyContactItem";
import CustomSnackbar from "../components/CustomSnackbar";
import BackButton from "../components/BackButton";

export default function EmergencyContacts() {
  const { colors } = useTheme();

  const [contacts, setContacts] = useState([
    {
      id: "1",
      name: "Dr. Smith",
      phone: "9876543210",
    },
    {
      id: "2",
      name: "Nurse Lily",
      phone: "9876501234",
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [deletedContact, setDeletedContact] = useState<any>(null);

  const [fabBottom] = useState(new Animated.Value(20));

  const openModal = (contact: any = null) => {
    if (contact) {
      setIsEditing(true);
      setSelectedContact(contact);
      setName(contact.name);
      setPhone(contact.phone);
    } else {
      setIsEditing(false);
      setSelectedContact(null);
      setName("");
      setPhone("");
    }
    setModalVisible(true);
  };

  const handleSave = () => {
    if (name.trim() === "" || phone.trim() === "") {
      Alert.alert("Please fill in both name and phone");
      return;
    }

    if (isEditing && selectedContact) {
      const updated = contacts.map((c) =>
        c.id === selectedContact.id ? { ...c, name, phone } : c
      );
      setContacts(updated);
      showSnackbar("Contact updated");
    } else {
      const newContact = {
        id: Date.now().toString(),
        name,
        phone,
      };
      setContacts([...contacts, newContact]);
      showSnackbar("Contact added");
    }

    setModalVisible(false);
  };

  const handleDelete = (id: string) => {
    const contactToDelete = contacts.find((c) => c.id === id);
    setDeletedContact(contactToDelete);
    setContacts(contacts.filter((c) => c.id !== id));
    showSnackbar("Contact deleted", true);
  };

  const undoDelete = () => {
    if (deletedContact) {
      setContacts((prev) => [...prev, deletedContact]);
      setDeletedContact(null);
      setSnackbarVisible(false);
    }
  };

  const showSnackbar = (message: string, withUndo = false) => {
    setSnackbarMsg(message);
    setSnackbarVisible(true);

    if (!withUndo) {
      setTimeout(() => {
        setSnackbarVisible(false);
      }, 3000);
    }
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={[styles.title, {color: colors.primary}]}>Emergency Contacts</Text>

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <EmergencyContactItem
            contact={item}
            onEdit={() => openModal(item)}
            onDelete={() => handleDelete(item.id)}
          />
        )}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? "Edit Contact" : "Add Contact"}
              </Text>
              <IconButton icon="close" onPress={() => setModalVisible(false)} />
            </View>

            <TextInput
              label="Name"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
            <TextInput
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.input}
            />

            <Button mode="contained" onPress={handleSave}>
              {isEditing ? "Update" : "Add"}
            </Button>
          </View>
        </View>
      </Modal>

      <Animated.View style={[styles.fabContainer, { bottom: fabBottom }]}>
        <FAB icon="plus" style={styles.fab} onPress={() => openModal()} />
      </Animated.View>

      <CustomSnackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        action={
          deletedContact
            ? {
                label: "Undo",
                onPress: undoDelete,
              }
            : undefined
        }
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMsg}
      </CustomSnackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, backgroundColor: "#f9f9f9" },
  title: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    textAlign: "center",
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#000000aa",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
  },
  input: {
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  fabContainer: {
    position: "absolute",
    right: 20,
  },
  fab: {
    backgroundColor: "#007bff",
  },
  snackbar: {
    backgroundColor: "#fff",
    marginBottom: 10,
    marginHorizontal: 16,
  },
});
