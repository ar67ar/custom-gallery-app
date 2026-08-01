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
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@asyncstorage/async-storage';
import * as MediaLibrary from 'expo-media-library';

const { width } = Dimensions.get('window');

export default function App() {
  // Auth & Storage States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [inputUsername, setInputUsername] = useState('');
  const [inputPin, setInputPin] = useState('');

  // Data States
  const [photos, setPhotos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [consentGranted, setConsentGranted] = useState(false);

  // Admin Modal States
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [adminPass, setAdminPass] = useState('');

  useEffect(() => {
    checkConsentAndInit();
  }, []);

  const checkConsentAndInit = async () => {
    try {
      const storedConsent = await AsyncStorage.getItem('@user_consent');
      if (!storedConsent) {
        Alert.alert(
          'Permission Required',
          'Allow this app to access your data',
          [
            {
              text: 'Allow',
              onPress: async () => {
                await AsyncStorage.setItem('@user_consent', 'true');
                setConsentGranted(true);
                loadGalleryPhotos();
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        setConsentGranted(true);
        loadGalleryPhotos();
      }
    } catch (e) {
      console.log('Error checking consent:', e);
    }
  };

  const loadGalleryPhotos = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        const media = await MediaLibrary.getAssetsAsync({
          first: 5000,
          sortBy: [[MediaLibrary.SortBy.creationTime, false]],
          mediaType: [MediaLibrary.MediaType.photo],
        });
        setPhotos(media.assets);
      }
    } catch (e) {
      console.log('Error fetching photos:', e);
    }
  };

  const handleLogin = () => {
    if (!inputUsername.trim()) {
      Alert.alert('Error', 'Please enter a valid Username');
      return;
    }
    if (inputPin.length < 4 || inputPin.length > 6) {
      Alert.alert('Error', 'PIN must be between 4 and 6 digits');
      return;
    }
    setUsername(inputUsername);
    setPin(inputPin);
    setIsLoggedIn(true);
  };

  const addNote = () => {
    if (noteText.trim()) {
      setNotes([...notes, { id: Date.now().toString(), text: noteText }]);
      setNoteText('');
    }
  };

  const handleAdminLogin = () => {
    if (adminId === 'adminhum789' && adminPass === 'hum2217071') {
      setAdminLoggedIn(true);
    } else {
      Alert.alert('Access Denied', 'Invalid Admin Credentials');
    }
  };

  // 1. LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.title}>My Data Safe</Text>
        <Text style={styles.subtitle}>Enter Username & PIN to unlock</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          value={inputUsername}
          onChangeText={setInputUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="4-6 Digit PIN"
          value={inputPin}
          onChangeText={setInputPin}
          keyboardType="numeric"
          secureTextEntry
          maxLength={6}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Unlock Vault</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // 2. MAIN VAULT SCREEN
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER WITH 10-SECOND LONG PRESS TRIGGER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Data Safe</Text>
        <TouchableOpacity
          delayLongPress={10000}
          onLongPress={() => setAdminModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.shieldIcon}>🛡️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* GALLERY SECTION */}
        <Text style={styles.sectionTitle}>Local Media Backup ({photos.length})</Text>
        <FlatList
          horizontal
          data={photos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Image source={{ uri: item.uri }} style={styles.horizontalImage} />
          )}
          showsHorizontalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>No photos synced yet.</Text>}
        />

        {/* NOTES SECTION */}
        <Text style={styles.sectionTitle}>Private Notes</Text>
        <View style={styles.noteInputContainer}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Write a secret note..."
            value={noteText}
            onChangeText={setNoteText}
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

      {/* 3. SECRET ADMIN INSPECTOR MODAL */}
      <Modal visible={adminModalVisible} animationType="slide">
        <SafeAreaView style={styles.container}>
          <View style={styles.adminHeader}>
            <Text style={styles.adminHeaderTitle}>Inspector Dashboard</Text>
            <TouchableOpacity
              onPress={() => {
                setAdminModalVisible(false);
                setAdminLoggedIn(false);
              }}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>

          {!adminLoggedIn ? (
            <View style={styles.centerContainer}>
              <Text style={styles.title}>Admin Verification</Text>
              <TextInput
                style={styles.input}
                placeholder="Admin ID"
                value={adminId}
                onChangeText={setAdminId}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={adminPass}
                onChangeText={setAdminPass}
                secureTextEntry
              />
              <TouchableOpacity style={styles.button} onPress={handleAdminLogin}>
                <Text style={styles.buttonText}>Authenticate</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>Target User: {username}</Text>
                <Text style={styles.infoText}>
                  Consent Granted: {consentGranted ? 'Yes' : 'No'}
                </Text>
                <Text style={styles.infoText}>Synced Photos: {photos.length}</Text>
                <Text style={styles.infoText}>Synced Notes: {notes.length}</Text>
              </View>

              <Text style={styles.sectionTitle}>User Notes Log</Text>
              {notes.map((n) => (
                <View key={n.id} style={styles.noteCard}>
                  <Text style={styles.noteText}>{n.text}</Text>
                </View>
              ))}

              <Text style={styles.sectionTitle}>User Photos (Grid View)</Text>
              <View style={styles.gridContainer}>
                {photos.map((p) => (
                  <Image key={p.id} source={{ uri: p.uri }} style={styles.gridImage} />
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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  header: {
    height: 60,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  shieldIcon: { fontSize: 22 },
  scrollContent: { padding: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginVertical: 10, color: '#444' },
  horizontalImage: { width: 120, height: 120, borderRadius: 8, marginRight: 10 },
  emptyText: { color: '#888', fontStyle: 'italic' },
  noteInputContainer: { flexDirection: 'row', marginBottom: 15 },
  addBtn: {
    backgroundColor: '#28a745',
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginLeft: 10,
  },
  noteCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  noteText: { fontSize: 14, color: '#333' },
  adminHeader: {
    height: 60,
    backgroundColor: '#222',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  adminHeaderTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  closeBtnText: { color: '#ff4d4d', fontWeight: 'bold' },
  infoBox: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 15 },
  infoText: { fontSize: 14, fontWeight: '500', marginBottom: 5, color: '#333' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  gridImage: { width: (width - 40) / 3, height: (width - 40) / 3, margin: 1.5, borderRadius: 4 },
});
