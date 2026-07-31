import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';

export default function App() {
  const [name, setName] = useState('');
  const [userCode, setUserCode] = useState('');
  const [savedCode, setSavedCode] = useState(null);

  // Secret Notes & Vault States
  const [userNote, setUserNote] = useState('');
  const [savedNote, setSavedNote] = useState('');
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);

  // Secret Admin Portal States
  const [isAdminModalVisible, setIsAdminModalVisible] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [adminPass, setAdminPass] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  const ADMIN_ID = "adminhum789";
  const ADMIN_PASS = "hum2217071";

  // Mock Admin Users Data
  const [usersList, setUsersList] = useState([
    { id: '1', name: 'Ali Khan', code: '482910', dataCount: '42 Photos', note: 'Secret bank passwords stored here.' },
    { id: '2', name: 'Hamza', code: '918234', dataCount: '128 Photos', note: 'Personal diary notes.' },
    { id: '3', name: 'Usman', code: '551209', dataCount: '15 Photos', note: 'Business ideas list.' },
    { id: '4', name: 'Rashid', code: '773210', dataCount: '89 Photos', note: 'Important codes.' },
  ]);

  useEffect(() => {
    checkExistingData();
  }, []);

  const checkExistingData = async () => {
    try {
      const storedCode = await AsyncStorage.getItem('@user_vault_code');
      const storedNote = await AsyncStorage.getItem('@user_vault_note');
      if (storedCode !== null) {
        setSavedCode(storedCode);
      }
      if (storedNote !== null) {
        setSavedNote(storedNote);
        setUserNote(storedNote);
      }
    } catch (e) {
      console.error("Error reading saved data", e);
    }
  };

  const handleGenerateCode = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Pehle apna Name enter karein.");
      return;
    }

    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      await AsyncStorage.setItem('@user_vault_code', generated);
      setSavedCode(generated);
      setUserCode(generated);
      Alert.alert(
        "Code Generated!",
        `Aapka Secret Code hai: ${generated}\n\nIs code ko safe jagah save kar lein!`
      );
    } catch (e) {
      Alert.alert("Error", "Code save nahi ho saka.");
    }
  };

  const requestGalleryPermission = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        "Permission Denied",
        "Gallery access ke liye storage permission zaruri hai."
      );
      return false;
    }
    return true;
  };

  const handleOpenVault = async () => {
    if (!name.trim() || !userCode.trim()) {
      Alert.alert("Error", "Name aur Code dono enter karein.");
      return;
    }

    if (savedCode && userCode.trim() === savedCode) {
      const hasPermission = await requestGalleryPermission();
      if (hasPermission) {
        setIsVaultUnlocked(true);
      }
    } else {
      Alert.alert("Access Denied", "Aapka Code galat hai!");
    }
  };

  const handleSaveNote = async () => {
    try {
      await AsyncStorage.setItem('@user_vault_note', userNote);
      setSavedNote(userNote);
      Alert.alert("Success", "Aapka secret note successfully save ho gaya hai!");
    } catch (e) {
      Alert.alert("Error", "Note save nahi ho saka.");
    }
  };

  const handleAdminLogin = () => {
    if (adminId === ADMIN_ID && adminPass === ADMIN_PASS) {
      setIsAdminLoggedIn(true);
      setAdminId('');
      setAdminPass('');
    } else {
      Alert.alert("Access Denied", "Incorrect Admin ID or Password!");
    }
  };

  const filteredUsers = usersList.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.code.includes(searchQuery)
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      {/* SHIELD LOGO WITH "My Data Safe" TITLE & 10s LONG PRESS */}
      <View style={styles.logoContainer}>
        <TouchableOpacity
          activeOpacity={0.9}
          onLongPress={() => setIsAdminModalVisible(true)}
          delayLongPress={10000}
        >
          <Ionicons name="shield-checkmark" size={60} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>My Data Safe</Text>
      </View>

      {!isVaultUnlocked ? (
        /* USER LOGIN CARD */
        <View style={styles.card}>
          <Text style={styles.label}>Enter Your Name:</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. User Name"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Enter Secret Code:</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 123456"
            keyboardType="numeric"
            value={userCode}
            onChangeText={setUserCode}
          />

          {!savedCode ? (
            <TouchableOpacity style={styles.btnPrimary} onPress={handleGenerateCode}>
              <Text style={styles.btnText}>Generate Code & Setup Vault</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.btnSuccess} onPress={handleOpenVault}>
              <Text style={styles.btnText}>Open Vault</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        /* UNLOCKED VAULT (GALLERY & NOTES SECTION) */
        <View style={styles.card}>
          <Text style={styles.unlockedHeader}>🔓 Vault Unlocked Successfully</Text>
          <Text style={styles.subtext}>Aap apni gallery access kar sakte hain aur niche apna secret text/note save kar sakte hain:</Text>

          <Text style={styles.label}>Write Secret Note / Data:</Text>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            placeholder="Kuch bhi likhein jo save karna ho..."
            multiline
            value={userNote}
            onChangeText={setUserNote}
          />

          <TouchableOpacity style={styles.btnPrimary} onPress={handleSaveNote}>
            <Text style={styles.btnText}>Save Secret Note</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.btnPrimary, { backgroundColor: '#FF3B30', marginTop: 10 }]} 
            onPress={() => setIsVaultUnlocked(false)}
          >
            <Text style={styles.btnText}>Lock Vault</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ADMIN SECRET MODAL & DASHBOARD */}
      <Modal
        visible={isAdminModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setIsAdminModalVisible(false)}
      >
        <View style={styles.adminContainer}>
          {!isAdminLoggedIn ? (
            <View style={styles.adminLoginBox}>
              <Text style={styles.adminTitle}>Admin Portal Login</Text>

              <TextInput
                style={styles.input}
                placeholder="Admin ID"
                value={adminId}
                onChangeText={setAdminId}
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder="Admin Password"
                secureTextEntry
                value={adminPass}
                onChangeText={setAdminPass}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#FF3B30' }]}
                  onPress={() => setIsAdminModalVisible(false)}
                >
                  <Text style={styles.btnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#007AFF' }]}
                  onPress={handleAdminLogin}
                >
                  <Text style={styles.btnText}>Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <View style={styles.dashboardHeader}>
                <Text style={styles.dashboardTitle}>Admin Dashboard</Text>
                <TouchableOpacity
                  onPress={() => {
                    setIsAdminLoggedIn(false);
                    setIsAdminModalVisible(false);
                  }}
                >
                  <Text style={{ color: '#FF3B30', fontWeight: 'bold' }}>Close</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.searchBar}
                placeholder="Search user by name or code..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />

              <Text style={styles.sectionHeader}>Registered Users List</Text>

              <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.userCard}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={styles.userName}>{item.name}</Text>
                      <Text style={styles.userCode}>Code: {item.code}</Text>
                      <Text style={styles.userData}>Files: {item.dataCount}</Text>
                      <Text style={styles.userNoteText} numberOfLines={2}>Note: {item.note}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.viewDataBtn}
                      onPress={() => {
                        Alert.alert(
                          "Stealth Mode Active",
                          `Silently inspecting ${item.name}'s data & notes. No notification sent.`
                        );
                      }}
                    >
                      <Text style={styles.viewDataText}>View Data</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f7',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    color: '#1a1a1a',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
  },
  label: {
    fontSize: 14,
    color: '#444',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  btnPrimary: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSuccess: {
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  unlockedHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34C759',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  adminContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  adminLoginBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 100,
  },
  adminTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalBtn: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dashboardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 10,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  userCode: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  userData: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 2,
  },
  userNoteText: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
    fontStyle: 'italic',
  },
  viewDataBtn: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewDataText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
