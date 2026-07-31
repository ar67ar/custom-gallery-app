import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, Modal, Alert, ScrollView, FlatList 
} from 'react-native';
import * as FileSystem from 'expo-file-system';

export default function App() {
  const [userName, setUserName] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [assignedSet, setAssignedSet] = useState(null);
  const [hasFullAccess, setHasFullAccess] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);

  // Admin Credentials & States
  const [isAdminVisible, setIsAdminVisible] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // System Storage Logic: 16 Sets | 32 Users Max | 2.5 GB Each
  const [usersList, setUsersList] = useState([
    { id: '1', name: 'Ali Khan', code: '482910', setNumber: 1, storageUsed: '0.4 GB', limit: '2.5 GB' },
    { id: '2', name: 'Ahmed Raza', code: '938411', setNumber: 1, storageUsed: '1.1 GB', limit: '2.5 GB' },
    { id: '3', name: 'Usman Ali', code: '556782', setNumber: 2, storageUsed: '0.8 GB', limit: '2.5 GB' },
  ]);

  // 1. Generate 6-Digit Code & Auto-Assign Set (2 Users per Set)
  const handleGenerateCode = () => {
    if (!userName.trim()) {
      Alert.alert('Error', 'Please enter your name first.');
      return;
    }

    if (usersList.length >= 32) {
      Alert.alert('Capacity Full', 'All 16 sets (32 users limit) are currently full.');
      return;
    }

    const currentSet = Math.floor(usersList.length / 2) + 1;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    const newUser = {
      id: (usersList.length + 1).toString(),
      name: userName,
      code: code,
      setNumber: currentSet,
      storageUsed: '0.0 GB',
      limit: '2.5 GB'
    };

    setUsersList([...usersList, newUser]);
    setGeneratedCode(code);
    setAssignedSet(currentSet);
    setShowConsentModal(true);
  };

  // 2. One-Time Full Storage Access (SAF Request)
  const handleGrantFullStorage = async () => {
    try {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        setHasFullAccess(true);
        setShowConsentModal(false);
        Alert.alert('Success', 'External Storage linked successfully!');
      } else {
        Alert.alert('Notice', 'Storage access is pending.');
        setShowConsentModal(false);
      }
    } catch (error) {
      setShowConsentModal(false);
    }
  };

  // 3. Hidden Trigger: 10-Second Long Press on Header
  const handleLogoLongPress = () => {
    setIsAdminVisible(true);
  };

  // 4. Admin Authentication
  const handleAdminLogin = () => {
    if (adminId === 'adminhum789' && adminPassword === 'hum2217071') {
      setIsAdminLoggedIn(true);
      setIsAdminVisible(false);
      setAdminId('');
      setAdminPassword('');
    } else {
      Alert.alert('Error', 'Incorrect Admin ID or Password');
    }
  };

  // 5. Silent Data Inspection (No Alert/Notification to User Device)
  const handleSilentViewUser = (user) => {
    Alert.alert(
      "Silent Data Inspection", 
      `User Name: ${user.name}\n6-Digit Code: ${user.code}\nAssigned Set: Set ${user.setNumber}\nStorage: ${user.storageUsed} / ${user.limit}\n\n(Viewed silently without notifying the user)`,
      [{ text: "OK" }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Secret Trigger Header */}
      <TouchableOpacity onLongPress={handleLogoLongPress} delayLongPress={10000}>
        <Text style={styles.header}>Cloud Vault & Secure Backup</Text>
      </TouchableOpacity>

      {!generatedCode ? (
        <View style={styles.card}>
          <Text style={styles.label}>Enter Your Name:</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. User Name"
            value={userName}
            onChangeText={setUserName}
          />
          <TouchableOpacity style={styles.button} onPress={handleGenerateCode}>
            <Text style={styles.buttonText}>Generate Code & Setup Vault</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.successText}>Welcome, {userName}!</Text>
          <Text style={styles.codeText}>Your Backup Code: {generatedCode}</Text>
          <Text style={styles.subText}>Storage Limit: 2.5 GB Allocated</Text>
          <Text style={[styles.subText, { color: hasFullAccess ? 'green' : 'red' }]}>
            {hasFullAccess ? "🟢 Storage Synchronized" : "🔴 Storage Access Required"}
          </Text>
        </View>
      )}

      {/* One-Time Setup Modal */}
      <Modal visible={showConsentModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Important Setup Notice</Text>
            <ScrollView style={{ maxHeight: 180 }}>
              <Text style={styles.modalBody}>
                1. To prevent data loss if your mobile is lost or sold, please allow full storage access so all files can map safely.{"\n\n"}
                2. System administrators can assist you in finding and recovering your data using your unique 6-digit code.
              </Text>
            </ScrollView>

            <TouchableOpacity style={[styles.button, { marginTop: 10 }]} onPress={handleGrantFullStorage}>
              <Text style={styles.buttonText}>Allow Storage & Proceed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Secret Admin Login Popup */}
      <Modal visible={isAdminVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Admin Portal Login</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Admin ID"
              value={adminId}
              onChangeText={setAdminId}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Enter Admin Password"
              secureTextEntry
              value={adminPassword}
              onChangeText={setAdminPassword}
            />
            <TouchableOpacity style={styles.button} onPress={handleAdminLogin}>
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: '#888', marginTop: 10 }]} 
              onPress={() => setIsAdminVisible(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Hidden Admin Dashboard */}
      <Modal visible={isAdminLoggedIn} animationType="slide">
        <View style={styles.adminContainer}>
          <Text style={styles.header}>Admin Control Center</Text>
          <Text style={styles.adminSub}>Registered Users: {usersList.length} / 32 (Max 16 Sets)</Text>
          
          <FlatList
            data={usersList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.userCard} onPress={() => handleSilentViewUser(item)}>
                <Text style={{ fontWeight: 'bold' }}>Name: {item.name}</Text>
                <Text>Code: {item.code} | Set: {item.setNumber} (2 Users Max)</Text>
                <Text style={{ color: '#666' }}>Storage: {item.storageUsed} / {item.limit}</Text>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#d9534f', marginTop: 15 }]} 
            onPress={() => setIsAdminLoggedIn(false)}
          >
            <Text style={styles.buttonText}>Exit Admin Dashboard</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8', padding: 20, justifyContent: 'center' },
  header: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#222' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, elevation: 3 },
  label: { fontSize: 16, marginBottom: 8, color: '#555' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 15 },
  button: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  successText: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32', textAlign: 'center' },
  codeText: { fontSize: 20, fontWeight: 'bold', color: '#007AFF', textAlign: 'center', marginVertical: 10 },
  subText: { textAlign: 'center', marginTop: 5, fontSize: 14, fontWeight: '600', color: '#555' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalBody: { fontSize: 14, color: '#555', lineHeight: 22, marginBottom: 15 },
  adminContainer: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: '#fff' },
  adminSub: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 15, textAlign: 'center' },
  userCard: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eee' }
});
