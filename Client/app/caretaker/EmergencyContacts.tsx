import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  RefreshControl,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  FAB,
  useTheme,
  Checkbox,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import CustomSnackbar from "../components/CustomSnackbar";
import CustomCard from "../components/CustomCard";
import BackButton from "../components/BackButton";
import { emergencyContactAPI } from "../../services/api";

interface EmergencyContact {
  id: number;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  is_primary: boolean;
}

export default function EmergencyContacts() {
  const { colors } = useTheme();

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedContact, setSelectedContact] = useState<EmergencyContact | null>(null);
  
  // Form fields
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await emergencyContactAPI.getAll();
      const fetchedContacts = response.contacts || [];
      
      // If no contacts, show sample data
      if (fetchedContacts.length === 0) {
        setContacts([
          {
            id: -1,
            name: "Mary Caretaker",
            relationship: "Primary Caregiver",
            phone: "+1234567890",
            email: "mary.caretaker@example.com",
            is_primary: true,
          },
          {
            id: -2,
            name: "Robert Elder",
            relationship: "Son",
            phone: "+1987654321",
            email: "robert.elder@example.com",
            is_primary: false,
          },
          {
            id: -3,
            name: "Dr. Sarah Wilson",
            relationship: "Family Doctor",
            phone: "+1555123456",
            email: "dr.wilson@cityhospital.com",
            is_primary: false,
          },
        ]);
      } else {
        setContacts(fetchedContacts);
      }
    } catch (error: any) {
      console.error("Error fetching contacts:", error);
      // Show sample data on error
      setContacts([
        {
          id: -1,
          name: "Emergency Contact",
          relationship: "Family",
          phone: "+1234567890",
          is_primary: true,
        },
      ]);
      showSnackbar("Showing sample data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchContacts();
  };

  const resetForm = () => {
    setName("");
    setRelationship("");
    setPhone("");
    setEmail("");
    setIsPrimary(false);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (contact: EmergencyContact) => {
    setSelectedContact(contact);
    setName(contact.name);
    setRelationship(contact.relationship);
    setPhone(contact.phone);
    setEmail(contact.email || "");
    setIsPrimary(contact.is_primary);
    setEditModalVisible(true);
  };

  const handleAdd = async () => {
    if (!name.trim() || !relationship.trim() || !phone.trim()) {
      Alert.alert("Missing Fields", "Please fill in name, relationship, and phone");
      return;
    }

    try {
      await emergencyContactAPI.add({
        name,
        relationship,
        phone,
        email: email || undefined,
        is_primary: isPrimary,
      });
      showSnackbar("Contact added successfully");
      setModalVisible(false);
      resetForm();
      fetchContacts();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add contact");
    }
  };

  const handleUpdate = async () => {
    if (!selectedContact) return;
    if (!name.trim() || !relationship.trim() || !phone.trim()) {
      Alert.alert("Missing Fields", "Please fill in name, relationship, and phone");
      return;
    }

    try {
      await emergencyContactAPI.update(selectedContact.id, {
        name,
        relationship,
        phone,
        email: email || undefined,
        is_primary: isPrimary,
      });
      showSnackbar("Contact updated successfully");
      setEditModalVisible(false);
      resetForm();
      setSelectedContact(null);
      fetchContacts();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update contact");
    }
  };

  const handleDelete = (contact: EmergencyContact) => {
    Alert.alert(
      "Delete Contact",
      `Are you sure you want to delete ${contact.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await emergencyContactAPI.delete(contact.id);
              showSnackbar("Contact deleted successfully");
              fetchContacts();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete contact");
            }
          },
        },
      ]
    );
  };

  const showSnackbar = (message: string) => {
    setSnackbarMsg(message);
    setSnackbarVisible(true);
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={[styles.title, { color: colors.primary }]}>Emergency Contacts</Text>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {contacts.length > 0 ? (
          contacts.map((contact) => (
            <CustomCard key={contact.id} style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                  <View style={styles.contactInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      {contact.is_primary && (
                        <View style={styles.primaryBadge}>
                          <Text style={styles.primaryText}>Primary</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.relationship}>{contact.relationship}</Text>
                  </View>
                </View>

                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <Ionicons name="call" size={16} color="#4CAF50" />
                    <Text style={styles.detailText}>{contact.phone}</Text>
                  </View>
                  {contact.email && (
                    <View style={styles.detailRow}>
                      <Ionicons name="mail" size={16} color="#2196F3" />
                      <Text style={styles.detailText}>{contact.email}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.actionButtons}>
                  <Button
                    mode="outlined"
                    icon="pencil"
                    onPress={() => openEditModal(contact)}
                    style={styles.editButton}
                    labelStyle={styles.editButtonLabel}
                  >
                    Edit
                  </Button>
                  <Button
                    mode="text"
                    icon="delete"
                    onPress={() => handleDelete(contact)}
                    textColor="#f44336"
                    labelStyle={styles.deleteButtonLabel}
                  >
                    Delete
                  </Button>
                </View>
              </View>
            </CustomCard>
          ))
        ) : (
          <Text style={styles.emptyText}>No emergency contacts added yet</Text>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={openAddModal}
        label="Add Contact"
      />

      {/* Add Contact Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <CustomCard style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Emergency Contact</Text>

            <TextInput
              label="Name *"
              value={name}
              onChangeText={setName}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Relationship *"
              value={relationship}
              onChangeText={setRelationship}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Phone *"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Email (optional)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              style={styles.input}
              mode="outlined"
            />

            <View style={styles.checkboxRow}>
              <Checkbox
                status={isPrimary ? "checked" : "unchecked"}
                onPress={() => setIsPrimary(!isPrimary)}
              />
              <Text style={styles.checkboxLabel}>Set as primary contact</Text>
            </View>

            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button mode="contained" onPress={handleAdd}>
                Add
              </Button>
            </View>
          </CustomCard>
        </View>
      </Modal>

      {/* Edit Contact Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <CustomCard style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Emergency Contact</Text>

            <TextInput
              label="Name *"
              value={name}
              onChangeText={setName}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Relationship *"
              value={relationship}
              onChangeText={setRelationship}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Phone *"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Email (optional)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              style={styles.input}
              mode="outlined"
            />

            <View style={styles.checkboxRow}>
              <Checkbox
                status={isPrimary ? "checked" : "unchecked"}
                onPress={() => setIsPrimary(!isPrimary)}
              />
              <Text style={styles.checkboxLabel}>Set as primary contact</Text>
            </View>

            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => {
                  setEditModalVisible(false);
                  resetForm();
                  setSelectedContact(null);
                }}
              >
                Cancel
              </Button>
              <Button mode="contained" onPress={handleUpdate}>
                Update
              </Button>
            </View>
          </CustomCard>
        </View>
      </Modal>

      <CustomSnackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)}>
        {snackbarMsg}
      </CustomSnackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    backgroundColor: "#F5F5F5",
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
    backgroundColor: "#FFF",
  },
  cardContent: {
    padding: 16,
  },
  cardTop: {
    marginBottom: 12,
  },
  contactInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  contactName: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
  },
  primaryBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "#4CAF50",
    borderRadius: 12,
  },
  primaryText: {
    fontSize: 10,
    color: "#FFF",
    fontFamily: "Poppins_600SemiBold",
  },
  relationship: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Poppins_400Regular",
  },
  detailsContainer: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
    fontFamily: "Poppins_400Regular",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    marginRight: 8,
    borderColor: "#2196F3",
  },
  editButtonLabel: {
    color: "#2196F3",
  },
  deleteButtonLabel: {
    color: "#f44336",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#999",
    marginTop: 50,
    fontFamily: "Poppins_400Regular",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: "#4CAF50",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  checkboxLabel: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    marginLeft: 8,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
});
