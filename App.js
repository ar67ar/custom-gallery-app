import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  Modal,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState('photos'); // 'photos' | 'notes'
  const [media, setMedia] = useState([]);
  const [hasPermission, setHasPermission] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // Notes States
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');

  // Admin Portal States
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pressTimer, setPressTimer] = useState(null);

  // Load Initial Data & Permissions
  useEffect(() => {
    requestPermissions();
    loadNotes();
  }, []);

  // Media Library Permissions & Fetching
  const requestPermissions = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    setHasPermission(status === 'granted');
    if (status === 'granted') {
      getPhotos();
    }
  };

  const getPhotos = async () => {
    try {
      const { assets } = await MediaLibrary.getAssetsAsync({
        first: 50,
        mediaType: ['photo'],
        sortBy: ['creationTime'],
      });
      setMedia(assets);
    } catch (error) {
      console.log('Error fetching photos:', error);
    }
  };

  // Notes Logic (AsyncStorage)
  const loadNotes = async () => {
    try {
      const savedNotes = await AsyncStorage.getItem('@user_notes');
      if (savedNotes !== null) {
        setNotes(JSON.parse(savedNotes));
      }
    } catch (e) {
      console.log('Error loading notes:', e);
    }
  };

  const addNote = async () => {
    if (newNote.trim() === '') return;
    const updatedNotes = [...notes, { id: Date.now().toString(), text: newNote }];
    setNotes(updatedNotes);
    setNewNote('');
    await AsyncStorage.setItem('@user_notes', JSON.stringify(updatedNotes));
  };

  const deleteNote = async (id) => {
    const updatedNotes = notes.filter((item) => item.id !== id);
    setNotes(updatedNotes);
    await AsyncStorage.setItem('@user_notes', JSON.stringify(updatedNotes));
  };

  // Secret Admin Access (10 Second Long-Press)
  const handlePressIn = () => {
    const timer = setTimeout(() => {
      setAdminModalVisible(true);
    }, 10000); // 10 Seconds hold
    setPressTimer(timer);
  };

  const handlePressOut = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  // Admin Auth Logic
  const handleAdminLogin = () => {
    if (username === 'admin' && password === '1234') {
      setIsLoggedIn(true);
      Alert.alert('Success', 'Welcome Admin!');
    } else {
      Alert.alert('Error', 'Invalid Admin Credentials');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Data Safe</Text>
        
        {/* Secret Shield Button */}
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.7}
        >
          <Text style={styles.shieldIcon}>🛡️</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'photos' && styles.activeTab]}
          onPress={() => setActiveTab('photos')}
        >
          <Text style={styles.tabText}>Photos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'notes' && styles.activeTab]}
          onPress={() => setActiveTab('notes')}
        >
          <Text style={styles.tabText}>Vault Notes</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      {activeTab === 'photos' ? (
        <View style={{ flex: 1 }}>
          {hasPermission ? (
            <FlatList
              data={media}
              numColumns={3}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => setSelectedImage(item.uri)}>
                  <Image source={{ uri: item.uri }} style={styles.imageThumbnail} />
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.centerText}>
              <Text style={{ color: '#fff' }}>Storage Permission Required</Text>
              <TouchableOpacity style={styles.permissionBtn} onPress={requestPermissions}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.notesContainer}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Write a secret note..."
              placeholderTextColor="#888"
              value={newNote}
              onChangeText={setNewNote}
            />
            <TouchableOpacity style={styles.addBtn} onPress={addNote}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={notes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.noteCard}>
                <Text style={styles.noteText}>{item.text}</Text>
                <TouchableOpacity onPress={() => deleteNote(item.id)}>
                  <Text style={{ color: '#ff5555', fontWeight: 'bold' }}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}

      {/* Image Viewer Modal */}
      <Modal visible={!!selectedImage} transparent={true} animationType="fade">
        <View style={styles.fullImageContainer}>
          <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedImage(null)}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Secret Admin Portal Modal */}
      <Modal visible={adminModalVisible} animationType="slide">
        <SafeAreaView style={styles.adminModalContainer}>
          <View style={styles.adminHeader}>
            <Text style={styles.adminTitle}>Admin Portal</Text>
            <TouchableOpacity
              onPress={() => {
                setAdminModalVisible(false);
                setIsLoggedIn(false);
              }}
            >
              <Text style={{ color: '#ff5555', fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
          </View>

          {!isLoggedIn ? (
            <View style={styles.loginForm}>
              <TextInput
                style={styles.adminInput}
                placeholder="Username"
                placeholderTextColor="#888"
                value={username}
                onChangeText={setUsername}
              />
              <TextInput
                style={styles.adminInput}
                placeholder="Password"
                placeholderTextColor="#888"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity style={styles.loginBtn} onPress={handleAdminLogin}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={{ padding: 20 }}>
              <Text style={styles.adminWelcome}>Welcome to Admin Dashboard</Text>
              <View style={styles.adminCard}>
                <Text style={styles.cardTitle}>Total Saved Notes</Text>
                <Text style={styles.cardVal}>{notes.length}</Text>
              </View>
              <View style={styles.adminCard}>
                <Text style={styles.cardTitle}>Total Photos Detected</Text>
                <Text style={styles.cardVal}>{media.length}</Text>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1f1f1f',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  shieldIcon: { fontSize: 24 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#1f1f1f', paddingBottom: 10 },
  tabButton: { flex: 1, padding: 12, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#007AFF' },
  tabText: { color: '#fff', fontWeight: '600' },
  imageThumbnail: { width: '33%', height: 120, margin: 1 },
  centerText: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  permissionBtn: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  notesContainer: { flex: 1, padding: 16 },
  inputContainer: { flexDirection: 'row', marginBottom: 16 },
  input: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  addBtn: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  noteCard: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  noteText: { color: '#fff', fontSize: 16 },
  fullImageContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: { width: '100%', height: '80%' },
  closeBtn: { position: 'absolute', top: 40, right: 20 },
  adminModalContainer: { flex: 1, backgroundColor: '#121212' },
  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  adminTitle: { fontSize: 22, color: '#fff', fontWeight: 'bold' },
  loginForm: { padding: 20 },
  adminInput: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  loginBtn: {
    backgroundColor: '#28a745',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  adminWelcome: { color: '#fff', fontSize: 18, marginBottom: 20, fontWeight: 'bold' },
  adminCard: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 8,
    marginBottom: 12,
  },
  cardTitle: { color: '#888', fontSize: 14 },
  cardVal: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 4 },
});
