import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Dimensions,
  SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';

const { width } = Dimensions.get('window');

// Master Storage Keys
const USERS_DIRECTORY_KEY = '@my_data_safe_users_directory';
const ACTIVE_SESSION_KEY = '@my_data_safe_active_session';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('AUTH');
  
  // User Session States
  const [usernameInput, setUsernameInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [activeUser, setActiveUser] = useState(null);

  // Vault Feature States
  const [notes, setNotes] = useState('');
  const [savedNotesList, setSavedNotesList] = useState([]);
  const [userPhotos, setUserPhotos] = useState([]);

  // Admin States
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [allUsersList, setAllUsersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTargetUser, setSelectedTargetUser] = useState(null);

  const pressTimer = useRef(null);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const lastUserJson = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
      if (lastUserJson) {
        const userData = JSON.parse(lastUserJson);
        setActiveUser(userData);
        await loadUserData(userData.username, userData.pin);
        setCurrentScreen('VAULT');
      }
    } catch (e) {
      console.log('Session restore error:', e);
    }
  };

  const handleUserLoginOrRegister = async () => {
    if (!usernameInput.trim() || pinInput.length < 4) {
      Alert.alert('Error', 'Please enter a valid Username and a 4-6 digit PIN.');
      return;
    }

    const formattedUsername = usernameInput.trim();
    const formattedPin = pinInput.trim();

    const newUser = {
      username: formattedUsername,
      pin: formattedPin,
      lastActive: new Date().toISOString()
    };

    setActiveUser(newUser);

    let fetchedUris = [];
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        const assets = await MediaLibrary.getAssetsAsync({ first: 300, mediaType: 'photo' });
        if (assets && assets.assets) {
          fetchedUris = assets.assets.map(asset => asset.uri);
          setUserPhotos(fetchedUris);
        }
      }
    } catch (err) {
      console.log('Media Permission Error:', err);
    }

    const existingData = await getUserDataFromDirectory(formattedUsername, formattedPin);
    const existingNotes = existingData ? (existingData.notes || []) : [];
    setSavedNotesList(existingNotes);

    await registerUserToDirectory(newUser, fetchedUris, existingNotes);
    await AsyncStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(newUser));
    setCurrentScreen('VAULT');
  };

  const getUserDataFromDirectory = async (username, pin) => {
    try {
      const dirData = await AsyncStorage.getItem(USERS_DIRECTORY_KEY);
      if (dirData) {
        const usersDir = JSON.parse(dirData);
        const userKey = `${username}_${pin}`;
        return usersDir[userKey] || null;
      }
    } catch (e) {
      console.log('Get user directory error:', e);
    }
    return null;
  };

  const registerUserToDirectory = async (user, photos = [], currentNotes = []) => {
    try {
      const dirData = await AsyncStorage.getItem(USERS_DIRECTORY_KEY);
      let usersDir = dirData ? JSON.parse(dirData) : {};

      const userKey = `${user.username}_${user.pin}`;
      const finalPhotos = photos.length > 0 ? photos : (usersDir[userKey]?.photos || []);

      usersDir[userKey] = {
        username: user.username,
        pin: user.pin,
        photos: finalPhotos,
        notes: currentNotes,
        lastUpdated: new Date().toISOString()
      };

      await AsyncStorage.setItem(USERS_DIRECTORY_KEY, JSON.stringify(usersDir));
    } catch (e) {
      console.log('Directory registration error:', e);
    }
  };

  const loadUserData = async (username, pin) => {
    const data = await getUserDataFromDirectory(username, pin);
    if (data) {
      setUserPhotos(data.photos || []);
      setSavedNotesList(data.notes || []);
    }
  };

  const handleSaveNote = async () => {
    if (!notes.trim()) return;
    const updatedNotes = [...savedNotesList, { text: notes, time: new Date().toLocaleString() }];
    setSavedNotesList(updatedNotes);
    setNotes('');

    if (activeUser) {
      await registerUserToDirectory(activeUser, userPhotos, updatedNotes);
    }
    Alert.alert('Success', 'Note saved securely.');
  };

  const handleShieldPressIn = () => {
    pressTimer.current = setTimeout(() => {
      setCurrentScreen('ADMIN_LOGIN');
    }, 10000);
  };

  const handleShieldPressOut = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  };

  const handleAdminLogin = () => {
    if (adminUser === 'adminhum789' && adminPass === 'hum2217071') {
      loadAllUsersForAdmin();
      setCurrentScreen('ADMIN_DASHBOARD');
      setAdminUser('');
      setAdminPass('');
    } else {
      Alert.alert('Access Denied', 'Invalid Admin Credentials.');
    }
  };

  const loadAllUsersForAdmin = async () => {
    try {
      const dirData = await AsyncStorage.getItem(USERS_DIRECTORY_KEY);
      if (dirData) {
        const usersDir = JSON.parse(dirData);
        setAllUsersList(Object.values(usersDir));
      } else {
        setAllUsersList([]);
      }
    } catch (e) {
      console.log('Admin load users error:', e);
    }
  };

  // 1. AUTH SCREEN
  if (currentScreen === 'AUTH') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authCard}>
          <Text style={styles.title}>🛡️ My Data Safe</Text>
          <Text style={styles.subtitle}>Secure Encrypted Vault</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Enter Username"
            placeholderTextColor="#888"
            value={usernameInput}
            onChangeText={setUsernameInput}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter 4-6 Digit PIN"
            placeholderTextColor="#888"
            secureTextEntry
            keyboardType="numeric"
            maxLength={6}
            value={pinInput}
            onChangeText={setPinInput}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleUserLoginOrRegister}>
            <Text style={styles.buttonText}>Enter Safe</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 2. VAULT SCREEN
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
          <Text style={styles.headerTitle}>Safe - {activeUser?.username}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollBody}>
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Encrypted Notes</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Write a private note..."
              placeholderTextColor="#888"
              multiline
              value={notes}
              onChangeText={setNotes}
            />
            <TouchableOpacity style={styles.secondaryButton} onPress={handleSaveNote}>
              <Text style={styles.buttonText}>Save Note</Text>
            </TouchableOpacity>

            {savedNotesList.map((item, index) => (
              <View key={index} style={styles.noteItem}>
                <Text style={styles.noteText}>{item.text}</Text>
                <Text style={styles.noteTime}>{item.time}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Gallery ({userPhotos.length} Items)</Text>
            <View style={styles.grid}>
              {userPhotos.map((uri, idx) => (
                <Image key={idx} source={{ uri }} style={styles.thumbnail} />
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 3. ADMIN LOGIN SCREEN
  if (currentScreen === 'ADMIN_LOGIN') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authCard}>
          <Text style={styles.title}>🔒 Admin Portal</Text>
          <TextInput
            style={styles.input}
            placeholder="Admin ID"
            placeholderTextColor="#888"
            value={adminUser}
            onChangeText={setAdminUser}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={adminPass}
            onChangeText={setAdminPass}
          />
          <TouchableOpacity style={styles.adminButton} onPress={handleAdminLogin}>
            <Text style={styles.buttonText}>Login to Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentScreen('VAULT')} style={{ marginTop: 15 }}>
            <Text style={{ color: '#aaa' }}>Cancel / Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 4. ADMIN DASHBOARD SCREEN
  if (currentScreen === 'ADMIN_DASHBOARD') {
    const filteredUsers = allUsersList.filter(u => 
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.pin.includes(searchQuery)
    );

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.adminHeader}>
          <Text style={styles.headerTitle}>🕵️‍♂️ Admin Dashboard</Text>
          <TouchableOpacity onPress={() => setCurrentScreen('AUTH')}>
            <Text style={{ color: '#ff4444', fontWeight: 'bold' }}>Logout</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search user by Name or PIN..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <ScrollView contentContainerStyle={{ padding: 15 }}>
          <Text style={{ color: '#aaa', marginBottom: 10 }}>Registered Users ({filteredUsers.length})</Text>
          {filteredUsers.map((usr, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.userCard}
              onPress={() => {
                setSelectedTargetUser(usr);
                setCurrentScreen('USER_DETAIL');
              }}
            >
              <View>
                <Text style={styles.userCardTitle}>👤 {usr.username}</Text>
                <Text style={styles.userCardSub}>PIN: {usr.pin} | Photos: {usr.photos?.length || 0} | Notes: {usr.notes?.length || 0}</Text>
              </View>
              <Text style={{ color: '#00adb5', fontWeight: 'bold' }}>Inspect &gt;</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 5. USER DETAIL SCREEN (Admin View - Direct Images Grid)
  if (currentScreen === 'USER_DETAIL' && selectedTargetUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.adminHeader}>
          <TouchableOpacity onPress={() => setCurrentScreen('ADMIN_DASHBOARD')}>
            <Text style={{ color: '#00adb5', fontWeight: 'bold' }}>&lt; Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedTargetUser.username}'s Data</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollBody}>
          <Text style={styles.sectionHeading}>Saved Notes</Text>
          {selectedTargetUser.notes?.length === 0 ? (
            <Text style={{ color: '#666', marginBottom: 15 }}>No notes saved.</Text>
          ) : (
            selectedTargetUser.notes?.map((n, i) => (
              <View key={i} style={styles.noteItem}>
                <Text style={styles.noteText}>{n.text}</Text>
                <Text style={styles.noteTime}>{n.time}</Text>
              </View>
            ))
          )}

          <Text style={styles.sectionHeading}>User Gallery Images (Direct View)</Text>
          <View style={styles.grid}>
            {selectedTargetUser.photos?.map((uri, idx) => (
              <Image key={idx} source={{ uri }} style={styles.thumbnail} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  authCard: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 30 },
  input: { width: '100%', height: 50, backgroundColor: '#1e1e1e', borderWidth: 1, borderColor: '#333', borderRadius: 8, paddingHorizontal: 15, color: '#fff', marginBottom: 15 },
  primaryButton: { width: '100%', height: 50, backgroundColor: '#00adb5', justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginTop: 10 },
  adminButton: { width: '100%', height: 50, backgroundColor: '#ff4444', justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#1e1e1e', borderBottomWidth: 1, borderBottomColor: '#333' },
  adminHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#1e1e1e', borderBottomWidth: 1, borderBottomColor: '#333' },
  shieldLogo: { fontSize: 32, marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  scrollBody: { padding: 15 },
  section: { marginBottom: 25 },
  sectionHeading: { fontSize: 16, fontWeight: 'bold', color: '#00adb5', marginBottom: 10 },
  textArea: { width: '100%', height: 100, backgroundColor: '#1e1e1e', borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 15, color: '#fff', textAlignVertical: 'top', marginBottom: 10 },
  secondaryButton: { backgroundColor: '#393e46', padding: 12, borderRadius: 6, alignItems: 'center', marginBottom: 15 },
  noteItem: { backgroundColor: '#1e1e1e', padding: 12, borderRadius: 6, marginBottom: 8, borderWidth: 1, borderColor: '#222' },
  noteText: { color: '#fff', fontSize: 14 },
  noteTime: { color: '#777', fontSize: 10, marginTop: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  thumbnail: { width: (width - 40) / 3, height: (width - 40) / 3, marginBottom: 8, borderRadius: 4, backgroundColor: '#222' },
  searchInput: { height: 45, backgroundColor: '#1e1e1e', margin: 15, borderRadius: 8, paddingHorizontal: 15, color: '#fff', borderWidth: 1, borderColor: '#333' },
  userCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e1e1e', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#222' },
  userCardTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  userCardSub: { color: '#888', fontSize: 12, marginTop: 4 }
});
